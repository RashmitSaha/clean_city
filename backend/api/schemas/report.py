from datetime import datetime
from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    category: str
    priority: str = "Medium"
    description: str = Field(min_length=10)
    address: str = Field(min_length=2)
    latitude: float | None = None
    longitude: float | None = None


class ReportUpdate(BaseModel):
    status: str | None = None
    collector_notes: str | None = None
    collector_id: int | None = None


class ReportOut(BaseModel):
    id: int
    category: str
    priority: str
    description: str
    address: str
    latitude: float | None
    longitude: float | None
    status: str
    priority_score: float | None
    photo_urls: list[str]
    citizen_id: int
    collector_id: int | None
    zone_id: int | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    collector_notes: str | None

    model_config = {"from_attributes": True}


class ReportListResponse(BaseModel):
    data: list[ReportOut]
    total: int
    page: int
    limit: int
