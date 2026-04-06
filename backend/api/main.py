"""
CleanCity — FastAPI backend
Run:  uvicorn api.main:app --reload --port 8000
"""
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.core.config import get_settings
from api.db.database import create_tables
from api.routers import auth, reports, collector, admin, categories

settings = get_settings()
logging.basicConfig(level=logging.DEBUG if settings.DEBUG else logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀  Starting CleanCity API")
    await create_tables()
    # Ensure upload directory exists
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    yield
    logger.info("🛑  Shutting down CleanCity API")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
API_PREFIX = "/api"
app.include_router(auth.router,       prefix=API_PREFIX)
app.include_router(reports.router,    prefix=API_PREFIX)
app.include_router(collector.router,  prefix=API_PREFIX)
app.include_router(admin.router,      prefix=API_PREFIX)
app.include_router(categories.router, prefix=API_PREFIX)

# ── Serve uploaded files ──────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/api/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
