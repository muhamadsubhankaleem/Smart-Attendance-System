from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Smart Attendance System"
    DEBUG: bool = True

    # MongoDB
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "smart_attendance"

    # JWT Auth
    SECRET_KEY: str = "your-super-secret-key-please-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # QR Attendance — short-lived tokens
    QR_SECRET_KEY: str = "qr-specific-secret-key-for-attendance-tokens"
    QR_EXPIRE_MINUTES: int = 5

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
