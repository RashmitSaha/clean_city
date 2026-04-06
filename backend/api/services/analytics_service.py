"""
Analytics service — SQL aggregations fed to the admin dashboard.
All queries are async and parameterised by a time period string.
"""
from datetime import datetime, timezone, timedelta

from sqlalchemy import func, select, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from api.models.report import Report, ReportStatus
from api.models.user import User, Role
from api.models.zone import Zone
from api.schemas.analytics import (
    AnalyticsResponse, AnalyticsSummary, LabelValue, TopCollector
)

PERIOD_DAYS = {"7d": 7, "30d": 30, "90d": 90, "1y": 365}


def _since(period: str) -> datetime:
    days = PERIOD_DAYS.get(period, 30)
    return datetime.now(timezone.utc) - timedelta(days=days)


async def get_analytics(db: AsyncSession, period: str = "30d") -> AnalyticsResponse:
    since = _since(period)
    base_filter = Report.created_at >= since

    # ── Summary ───────────────────────────────────────────────────────────────
    total_q = await db.execute(
        select(func.count()).select_from(Report).where(base_filter)
    )
    total_reports: int = total_q.scalar_one() or 0

    resolved_q = await db.execute(
        select(func.count()).select_from(Report).where(
            and_(base_filter, Report.status == ReportStatus.resolved)
        )
    )
    resolved: int = resolved_q.scalar_one() or 0

    # Average resolution time in hours
    avg_res_q = await db.execute(
        select(
            func.avg(
                func.julianday(Report.resolved_at) - func.julianday(Report.created_at)
            ) * 24  # days → hours
        ).where(
            and_(base_filter, Report.resolved_at.isnot(None))
        )
    )
    avg_resolution_hours_raw = avg_res_q.scalar_one()
    avg_resolution_hours = round(float(avg_resolution_hours_raw), 1) if avg_resolution_hours_raw else None

    resolution_rate = round((resolved / total_reports) * 100, 1) if total_reports else 0.0

    summary = AnalyticsSummary(
        total_reports=total_reports,
        resolved=resolved,
        avg_resolution_hours=avg_resolution_hours,
        resolution_rate=resolution_rate,
    )

    # ── Reports over time (bucket by day or week) ──────────────────────────────
    days = PERIOD_DAYS.get(period, 30)
    # SQLite: strftime; PostgreSQL: date_trunc — we use strftime for portability
    trunc_fmt = "%Y-%m-%d" if days <= 30 else "%Y-%W"
    time_q = await db.execute(
        select(
            func.strftime(trunc_fmt, Report.created_at).label("bucket"),
            func.count().label("cnt"),
        )
        .where(base_filter)
        .group_by("bucket")
        .order_by("bucket")
    )
    reports_over_time = [
        LabelValue(label=row.bucket, value=row.cnt) for row in time_q.all()
    ]

    # ── By category ───────────────────────────────────────────────────────────
    cat_q = await db.execute(
        select(Report.category, func.count().label("cnt"))
        .where(base_filter)
        .group_by(Report.category)
        .order_by(func.count().desc())
    )
    reports_by_category = [LabelValue(label=r.category, value=r.cnt) for r in cat_q.all()]

    # ── By status ─────────────────────────────────────────────────────────────
    stat_q = await db.execute(
        select(Report.status, func.count().label("cnt"))
        .where(base_filter)
        .group_by(Report.status)
    )
    reports_by_status = [LabelValue(label=r.status.replace("_", " ").title(), value=r.cnt) for r in stat_q.all()]

    # ── By zone ───────────────────────────────────────────────────────────────
    zone_q = await db.execute(
        select(Zone.name, func.count(Report.id).label("cnt"))
        .join(Report, Report.zone_id == Zone.id)
        .where(base_filter)
        .group_by(Zone.name)
        .order_by(func.count(Report.id).desc())
    )
    reports_by_zone = [LabelValue(label=r.name, value=r.cnt) for r in zone_q.all()]

    # ── Top collectors ────────────────────────────────────────────────────────
    top_q = await db.execute(
        select(
            User.full_name,
            func.count(Report.id).label("completed"),
            func.avg(
                (func.julianday(Report.resolved_at) - func.julianday(Report.created_at)) * 24 * 60
            ).label("avg_minutes"),
        )
        .join(User, Report.collector_id == User.id)
        .where(
            and_(base_filter, Report.status == ReportStatus.resolved, Report.resolved_at.isnot(None))
        )
        .group_by(User.full_name)
        .order_by(func.count(Report.id).desc())
        .limit(10)
    )
    top_collectors = [
        TopCollector(
            name=r.full_name,
            completed=r.completed,
            avg_minutes=int(r.avg_minutes) if r.avg_minutes else None,
        )
        for r in top_q.all()
    ]

    return AnalyticsResponse(
        summary=summary,
        reports_over_time=reports_over_time,
        reports_by_category=reports_by_category,
        reports_by_status=reports_by_status,
        reports_by_zone=reports_by_zone,
        top_collectors=top_collectors,
    )
