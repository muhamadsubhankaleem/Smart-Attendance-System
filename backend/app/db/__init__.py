from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def init_db() -> None:
    """Create all tables on startup."""
    from app.models import User  # noqa: F401 — ensure model is registered
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] SQLite database ready")


async def get_db():
    """FastAPI dependency — yields a DB session."""
    async with async_session() as session:
        yield session


async def close_db() -> None:
    await engine.dispose()
    print("[OK] Database connection closed")
