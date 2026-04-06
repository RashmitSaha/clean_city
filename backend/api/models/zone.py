from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from api.db.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Bounding box — optional for geo-filtering
    lat_min: Mapped[float | None] = mapped_column(Float)
    lat_max: Mapped[float | None] = mapped_column(Float)
    lng_min: Mapped[float | None] = mapped_column(Float)
    lng_max: Mapped[float | None] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    users = relationship("User", back_populates="zone")
    reports = relationship("Report", back_populates="zone")

    def __repr__(self) -> str:
        return f"<Zone id={self.id} name={self.name!r}>"
