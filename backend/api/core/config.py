from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "CleanCity API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database (SQLite for dev, swap to PostgreSQL DSN for prod)
    DATABASE_URL: str = "sqlite+aiosqlite:///./cleancity.db"

    # Node.js realtime service
    REALTIME_URL: str = "http://localhost:4000"

    # C++ engine gRPC / HTTP bridge
    ENGINE_URL: str = "http://localhost:8001"

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 10

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",   # Vite dev server
        "http://localhost:4173",   # Vite preview
        "https://cleancity.app",   # Production
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
