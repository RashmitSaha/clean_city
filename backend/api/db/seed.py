"""
Seed the database with demo users and sample reports.
Run with:  python -m api.db.seed
"""
import asyncio
from datetime import datetime, timezone, timedelta
import random

from api.db.database import AsyncSessionLocal, create_tables
from api.models.user import User, Role
from api.models.report import Report, ReportStatus, Priority, Category
from api.models.zone import Zone
from api.core.security import hash_password


ZONES = ["North District", "South District", "East Ward", "West Ward", "Central"]

SAMPLE_ADDRESSES = [
    "123 Main St", "456 Park Ave", "789 Elm Rd", "22 River Blvd",
    "55 Oak Lane", "10 Market Sq", "300 Industrial Way", "7 Garden St",
]


async def seed():
    await create_tables()

    async with AsyncSessionLocal() as db:
        # ── Zones ─────────────────────────────────────────────────────────────
        zones = []
        for name in ZONES:
            z = Zone(name=name, description=f"Coverage area: {name}")
            db.add(z)
            zones.append(z)
        await db.flush()

        # ── Admin ─────────────────────────────────────────────────────────────
        admin = User(
            full_name="Admin User",
            email="admin@cleancity.app",
            hashed_password=hash_password("admin1234"),
            role=Role.admin,
            phone="+1-555-0100",
            zone_id=zones[0].id,
            is_active=True,
        )
        db.add(admin)

        # ── Collectors ────────────────────────────────────────────────────────
        collectors = []
        for i, name in enumerate(["Carlos Rivera", "Aisha Okon", "Priya Singh", "Tom Wei"]):
            c = User(
                full_name=name,
                email=f"collector{i+1}@cleancity.app",
                hashed_password=hash_password("collector1234"),
                role=Role.collector,
                phone=f"+1-555-020{i}",
                zone_id=zones[i % len(zones)].id,
                is_active=True,
            )
            db.add(c)
            collectors.append(c)

        # ── Citizens ──────────────────────────────────────────────────────────
        citizens = []
        for i, name in enumerate(["Maria Santos", "John Doe", "Yuki Tanaka", "Ahmed Hassan", "Sophie Martin"]):
            u = User(
                full_name=name,
                email=f"citizen{i+1}@cleancity.app",
                hashed_password=hash_password("citizen1234"),
                role=Role.citizen,
                phone=f"+1-555-030{i}",
                zone_id=zones[i % len(zones)].id,
                is_active=True,
            )
            db.add(u)
            citizens.append(u)

        await db.flush()

        # ── Reports ───────────────────────────────────────────────────────────
        statuses = list(ReportStatus)
        priorities = list(Priority)
        categories = list(Category)

        for i in range(30):
            days_ago = random.randint(1, 90)
            created = datetime.now(timezone.utc) - timedelta(days=days_ago)
            status = random.choice(statuses)
            citizen = random.choice(citizens)
            collector = random.choice(collectors) if status != ReportStatus.pending else None

            r = Report(
                citizen_id=citizen.id,
                collector_id=collector.id if collector else None,
                zone_id=random.choice(zones).id,
                category=random.choice(categories),
                priority=random.choice(priorities),
                description="Sample waste issue report for demo purposes.",
                address=random.choice(SAMPLE_ADDRESSES),
                latitude=round(random.uniform(40.6, 40.9), 6),
                longitude=round(random.uniform(-74.1, -73.8), 6),
                status=status,
                created_at=created,
                updated_at=created + timedelta(hours=random.randint(1, 48)),
            )
            db.add(r)

        await db.commit()
        print("✅  Database seeded successfully.")
        print("   admin@cleancity.app  / admin1234")
        print("   collector1@cleancity.app  / collector1234")
        print("   citizen1@cleancity.app   / citizen1234")


if __name__ == "__main__":
    asyncio.run(seed())
