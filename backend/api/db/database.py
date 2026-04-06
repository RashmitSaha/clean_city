from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from api.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # FastAPI dependency
    async with AsyncSessionLocal() as session:
        yield session


async def create_tables():
    """Called on startup — creates tables if they don't exist."""
    # Import models so SQLAlchemy registers them before create_all
    import api.models.user    # noqa: F401
    import api.models.report  # noqa: F401
    import api.models.zone    # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
