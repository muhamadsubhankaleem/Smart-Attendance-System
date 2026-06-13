import json
from typing import List
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "SmartAttend"
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "smart_attendance"
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = Path(__file__).resolve().parent.parent / ".env"


settings = Settings()
