from pydantic import BaseModel


class LabelValue(BaseModel):
    label: str
    value: int


class TopCollector(BaseModel):
    name: str
    completed: int
    avg_minutes: int | None = None


class AnalyticsSummary(BaseModel):
    total_reports: int
    resolved: int
    avg_resolution_hours: float | None
    resolution_rate: float


class AnalyticsResponse(BaseModel):
    summary: AnalyticsSummary
    reports_over_time: list[LabelValue]
    reports_by_category: list[LabelValue]
    reports_by_status: list[LabelValue]
    reports_by_zone: list[LabelValue]
    top_collectors: list[TopCollector]
