"""
Admin-only endpoints — full platform management.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.database import get_db
from api.core.security import require_role, hash_password
from api.models.user import User, Role
from api.models.zone import Zone
from api.schemas.analytics import AnalyticsResponse
from api.schemas.report import ReportListResponse, ReportOut, ReportUpdate
from api.services.analytics_service import get_analytics
from api.services import report_service

router = APIRouter(prefix="/admin", tags=["Admin"])
AdminAuth = Annotated[dict, Depends(require_role("admin"))]


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics", response_model=AnalyticsResponse, summary="Platform analytics")
async def analytics(
    current: AdminAuth,
    db: AsyncSession = Depends(get_db),
    period: str = Query("30d", pattern="^(7d|30d|90d|1y)$"),
):
    return await get_analytics(db, period=period)


# ── Reports (admin has full access) ──────────────────────────────────────────

@router.get("/reports", response_model=ReportListResponse, summary="All reports with full filters")
async def list_all_reports(
    current: AdminAuth,
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(None),
    zone_id: int | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    reports, total = await report_service.get_reports(
        db, zone_id=zone_id, status_filter=status, search=search, page=page, limit=limit
    )
    return ReportListResponse(
        data=[ReportOut.model_validate(r) for r in reports],
        total=total, page=page, limit=limit,
    )


@router.patch("/reports/{report_id}", response_model=ReportOut, summary="Admin: assign or update any report")
async def admin_update_report(
    report_id: int,
    payload: ReportUpdate,
    current: AdminAuth,
    db: AsyncSession = Depends(get_db),
):
    return ReportOut.model_validate(
        await report_service.update_report(db, report_id, payload, actor=current)
    )


# ── Users ─────────────────────────────────────────────────────────────────────

class UserCreateAdmin(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str
    zone_id: int | None = None
    phone: str | None = None


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    zone_id: int | None
    is_active: bool
    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    data: list[UserOut]
    total: int


@router.get("/users", response_model=UserListResponse, summary="List all platform users")
async def list_users(
    current: AdminAuth,
    db: AsyncSession = Depends(get_db),
    role: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    q = select(User)
    if role:
        try:
            q = q.where(User.role == Role(role))
        except ValueError:
            pass
    total_q = await db.execute(select(func.count()).select_from(User))
    total = total_q.scalar_one()
    rows = await db.execute(q.offset((page - 1) * limit).limit(limit))
    return UserListResponse(data=[UserOut.model_validate(u) for u in rows.scalars().all()], total=total)


@router.post("/users", response_model=UserOut, status_code=201, summary="Create user (any role)")
async def create_user(payload: UserCreateAdmin, current: AdminAuth, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")
    try:
        role = Role(payload.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role: {payload.role}")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=role,
        zone_id=payload.zone_id,
        phone=payload.phone,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.patch("/users/{user_id}/deactivate", response_model=UserOut, summary="Deactivate a user account")
async def deactivate_user(user_id: int, current: AdminAuth, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


# ── Zones ──────────────────────────────────────────────────────────────────────

class ZoneCreate(BaseModel):
    name: str
    description: str | None = None


class ZoneOut(BaseModel):
    id: int
    name: str
    description: str | None
    model_config = {"from_attributes": True}


@router.get("/zones", response_model=list[ZoneOut], summary="List all zones")
async def list_zones(current: AdminAuth, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Zone).order_by(Zone.name))
    return [ZoneOut.model_validate(z) for z in result.scalars().all()]


@router.post("/zones", response_model=ZoneOut, status_code=201, summary="Create a zone")
async def create_zone(payload: ZoneCreate, current: AdminAuth, db: AsyncSession = Depends(get_db)):
    zone = Zone(name=payload.name, description=payload.description)
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return ZoneOut.model_validate(zone)


@router.delete("/zones/{zone_id}", status_code=204, summary="Delete a zone")
async def delete_zone(zone_id: int, current: AdminAuth, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Zone).where(Zone.id == zone_id))
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    await db.delete(zone)
    await db.commit()
