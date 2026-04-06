from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from api.db.database import get_db
from api.core.security import get_current_user, require_role
from api.schemas.report import ReportCreate, ReportListResponse, ReportOut, ReportUpdate
from api.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

CitizenOrAdmin = Annotated[dict, Depends(require_role("citizen", "admin"))]
AnyAuth = Annotated[dict, Depends(get_current_user)]


@router.post("", response_model=ReportOut, status_code=201, summary="Submit a new waste report")
async def create_report(
    category:    str        = Form(...),
    priority:    str        = Form("Medium"),
    description: str        = Form(...),
    address:     str        = Form(...),
    latitude:    float | None = Form(None),
    longitude:   float | None = Form(None),
    photos: list[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(require_role("citizen", "admin")),
):
    payload = ReportCreate(
        category=category,
        priority=priority,
        description=description,
        address=address,
        latitude=latitude,
        longitude=longitude,
    )
    report = await report_service.create_report(
        db, citizen_id=current["id"], payload=payload, photos=photos or None
    )
    return ReportOut.model_validate(report)


@router.get("", response_model=ReportListResponse, summary="List reports (scoped by role)")
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(get_current_user),
    status: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
):
    role = current["role"]
    citizen_id   = current["id"] if role == "citizen"   else None
    collector_id = current["id"] if role == "collector" else None

    reports, total = await report_service.get_reports(
        db,
        citizen_id=citizen_id,
        collector_id=collector_id,
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


@router.get("/{report_id}", response_model=ReportOut, summary="Get a single report by ID")
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    report = await report_service.get_report_by_id(db, report_id)
    return ReportOut.model_validate(report)


@router.patch("/{report_id}", response_model=ReportOut, summary="Update report status or assignment")
async def update_report(
    report_id: int,
    payload: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current: dict = Depends(get_current_user),
):
    report = await report_service.update_report(db, report_id, payload, actor=current)
    return ReportOut.model_validate(report)
