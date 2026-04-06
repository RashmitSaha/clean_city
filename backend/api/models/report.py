import enum
from datetime import datetime, timezone

from sqlalchemy import (
    DateTime, Enum, Float, ForeignKey, Integer, String, Text, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.db.database import Base


class ReportStatus(str, enum.Enum):
    pending = "pending"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    cancelled = "cancelled"


class Priority(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class Category(str, enum.Enum):
    illegal_dumping = "Illegal Dumping"
    missed_pickup = "Missed Pickup"
    overflowing_bin = "Overflowing Bin"
    hazardous_waste = "Hazardous Waste"
    recycling_issue = "Recycling Issue"
    bulk_waste = "Bulk Waste"
    other = "Other"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Relationships
    citizen_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    collector_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id"), nullable=True)

    # Content
    category: Mapped[Category] = mapped_column(Enum(Category), nullable=False)
    priority: Mapped[Priority] = mapped_column(Enum(Priority), default=Priority.medium)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Location
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)

    # Media — list of relative paths stored as JSON array
    photo_urls: Mapped[list | None] = mapped_column(JSON, default=list)

    # Status & scoring
    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus), default=ReportStatus.pending, index=True)
    priority_score: Mapped[float | None] = mapped_column(Float)  # computed by C++ engine

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Notes
    collector_notes: Mapped[str | None] = mapped_column(Text)

    # Relationships
    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="reports_filed")
    collector = relationship("User", foreign_keys=[collector_id], back_populates="tasks_assigned")
    zone = relationship("Zone", back_populates="reports")

    def __repr__(self) -> str:
        return f"<Report id={self.id} status={self.status} category={self.category}>"
