"""
Collector portal endpoints — task list, task detail, status updates.
All routes require the `collector` role.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.database import get_db
from api.core.security import require_role
from api.schemas.report import ReportListResponse, ReportOut, ReportUpdate
from api.services import report_service

router = APIRouter(prefix="/collector", tags=["Collector"])

CollectorAuth = Annotated[dict, Depends(require_role("collector", "admin"))]


@router.get("/tasks", response_model=ReportListResponse, summary="Get all tasks assigned to me")
async def get_my_tasks(
    current: CollectorAuth,
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(None, description="Filter by status (assigned, in_progress, resolved)"),
    search: str | None = Query(None, description="Search by address"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    reports, total = await report_service.get_reports(
        db,
        collector_id=current["id"],
        status_filter=status,
        search=search,
        page=page,
        limit=limit,
    )
    return ReportListResponse(
        data=[ReportOut.model_validate(r) for r in reports],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/tasks/{task_id}", response_model=ReportOut, summary="Get a single task detail")
async def get_task(
    task_id: int,
    current: CollectorAuth,
    db: AsyncSession = Depends(get_db),
):
    return ReportOut.model_validate(await report_service.get_report_by_id(db, task_id))


@router.patch("/tasks/{task_id}", response_model=ReportOut, summary="Update task status or add notes")
async def update_task(
    task_id: int,
    payload: ReportUpdate,
    current: CollectorAuth,
    db: AsyncSession = Depends(get_db),
):
    report = await report_service.update_report(db, task_id, payload, actor=current)
    return ReportOut.model_validate(report)
