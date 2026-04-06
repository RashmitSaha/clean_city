"""
Report service — handles creation, querying, status updates, photo uploads,
C++ engine scoring, and realtime event dispatch to the Node.js service.
"""
import os
import uuid
import asyncio
import aiohttp
import aiofiles
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from api.core.config import get_settings
from api.models.report import Report, ReportStatus, Priority, Category
from api.schemas.report import ReportCreate, ReportUpdate

settings = get_settings()
UPLOAD_PATH = Path(settings.UPLOAD_DIR)
UPLOAD_PATH.mkdir(parents=True, exist_ok=True)

PRIORITY_SCORE_MAP = {
    Priority.low: 1.0,
    Priority.medium: 2.0,
    Priority.high: 3.5,
    Priority.critical: 5.0,
}


# ── Photo upload ──────────────────────────────────────────────────────────────

async def save_photos(files: list[UploadFile]) -> list[str]:
    """Persist up to 4 images; return relative URL paths."""
    if len(files) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 photos per report")

    paths: list[str] = []
    for f in files:
        ext = Path(f.filename or "img").suffix or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        dest = UPLOAD_PATH / filename
        async with aiofiles.open(dest, "wb") as out:
            content = await f.read()
            if len(content) > settings.MAX_UPLOAD_MB * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"File {f.filename!r} exceeds {settings.MAX_UPLOAD_MB} MB")
            await out.write(content)
        paths.append(f"/uploads/{filename}")
    return paths


# ── C++ engine — priority scoring ─────────────────────────────────────────────

async def fetch_priority_score(report_id: int, category: str, priority: str, lat: float | None, lng: float | None) -> float:
    """
    Call the C++ HTTP bridge to get a computed priority score.
    Falls back to a simple lookup if the engine is unreachable.
    """
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2)) as session:
            async with session.post(
                f"{settings.ENGINE_URL}/score",
                json={"report_id": report_id, "category": category, "priority": priority, "lat": lat, "lng": lng},
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return float(data["score"])
    except Exception:
        pass  # Engine offline — use fallback
    # Fallback: enum lookup
    try:
        return PRIORITY_SCORE_MAP.get(Priority(priority), 2.0)
    except ValueError:
        return 2.0


# ── Node.js realtime dispatch ─────────────────────────────────────────────────

async def emit_event(event: str, payload: dict):
    """Fire-and-forget push to the Node.js realtime service."""
    async def _send():
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2)) as s:
                await s.post(f"{settings.REALTIME_URL}/internal/emit", json={"event": event, "payload": payload})
        except Exception:
            pass  # realtime service offline — non-fatal

    asyncio.create_task(_send())


# ── CRUD ──────────────────────────────────────────────────────────────────────

async def create_report(
    db: AsyncSession,
    citizen_id: int,
    payload: ReportCreate,
    photos: list[UploadFile] | None = None,
) -> Report:
    photo_urls = await save_photos(photos) if photos else []

    report = Report(
        citizen_id=citizen_id,
        category=Category(payload.category),
        priority=Priority(payload.priority),
        description=payload.description,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        photo_urls=photo_urls,
        status=ReportStatus.pending,
    )
    db.add(report)
    await db.flush()  # get auto-incremented id

    # Score via C++ engine (async, non-blocking)
    score = await fetch_priority_score(
        report.id, payload.category, payload.priority, payload.latitude, payload.longitude
    )
    report.priority_score = score
    await db.commit()
    await db.refresh(report)

    await emit_event("report:created", {"id": report.id, "category": report.category, "priority": report.priority})
    return report


async def get_reports(
    db: AsyncSession,
    *,
    citizen_id: int | None = None,
    collector_id: int | None = None,
    zone_id: int | None = None,
    status_filter: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 10,
) -> tuple[list[Report], int]:
    filters = []
    if citizen_id:
        filters.append(Report.citizen_id == citizen_id)
    if collector_id:
        filters.append(Report.collector_id == collector_id)
    if zone_id:
        filters.append(Report.zone_id == zone_id)
    if status_filter and status_filter != "All":
        try:
            filters.append(Report.status == ReportStatus(status_filter.lower().replace(" ", "_")))
        except ValueError:
            pass
    if search:
        filters.append(Report.address.ilike(f"%{search}%"))

    where = and_(*filters) if filters else True

    total_q = await db.execute(select(func.count()).select_from(Report).where(where))
    total = total_q.scalar_one()

    rows_q = await db.execute(
        select(Report)
        .where(where)
        .order_by(Report.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return rows_q.scalars().all(), total


async def get_report_by_id(db: AsyncSession, report_id: int) -> Report:
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


async def update_report(db: AsyncSession, report_id: int, payload: ReportUpdate, actor: dict) -> Report:
    report = await get_report_by_id(db, report_id)

    # Collectors can only update their own tasks
    if actor["role"] == "collector" and report.collector_id != actor["id"]:
        raise HTTPException(status_code=403, detail="Not your task")

    old_status = report.status

    if payload.status:
        try:
            report.status = ReportStatus(payload.status.lower().replace(" ", "_"))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    if payload.collector_notes is not None:
        report.collector_notes = payload.collector_notes

    if payload.collector_id is not None and actor["role"] == "admin":
        report.collector_id = payload.collector_id
        report.status = ReportStatus.assigned

    if report.status == ReportStatus.resolved and old_status != ReportStatus.resolved:
        report.resolved_at = datetime.now(timezone.utc)

    report.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(report)

    if report.status != old_status:
        await emit_event("report:status_changed", {
            "id": report.id,
            "old_status": old_status,
            "new_status": report.status,
            "collector_id": report.collector_id,
            "citizen_id": report.citizen_id,
        })

    return report
