from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    _db = _client[settings.DB_NAME]
    try:
        await _client.admin.command("ping")
        print(f"[OK] Connected to MongoDB [{settings.DB_NAME}]")
    except Exception as e:
        print(
            f"\n[WARN] MongoDB connection failed: {e}\n"
            "   The API will start but database operations will fail.\n"
            "   Start MongoDB or set MONGO_URI in backend/.env\n"
        )


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        print("[OK] MongoDB connection closed")


async def get_db() -> AsyncIOMotorDatabase:
    return _db
