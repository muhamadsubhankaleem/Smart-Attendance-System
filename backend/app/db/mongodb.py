from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGO_URI)
    _db = _client[settings.DB_NAME]
    # Verify connectivity on startup
    await _client.admin.command("ping")
    print(f"✅ Connected to MongoDB [{settings.DB_NAME}]")


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        print("🔌 MongoDB connection closed")


async def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency — returns the active database instance."""
    return _db
