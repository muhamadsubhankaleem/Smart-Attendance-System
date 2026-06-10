from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db() -> None:
    global _client, _db
    # serverSelectionTimeoutMS=5000 → fail fast instead of hanging 30 s
    _client = AsyncIOMotorClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000,
    )
    _db = _client[settings.DB_NAME]
    try:
        await _client.admin.command("ping")
        print(f"✅ Connected to MongoDB [{settings.DB_NAME}]")
    except Exception as e:
        print(
            f"\n⚠️  MongoDB connection failed: {e}\n"
            "   Make sure MongoDB is running:\n"
            "   • Local:  start the MongoDB service (mongod)\n"
            "   • Atlas:  set MONGO_URI in backend/.env\n"
            "   The API will start but database operations will fail.\n"
        )


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        print("🔌 MongoDB connection closed")


async def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency — returns the active database instance."""
    return _db
