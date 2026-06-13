import sys, os

# Add backend dir to path so "from app.xxx" works when running directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import connect_db, close_db
from app.api import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    print(f"[OK] {settings.APP_NAME} API is running")
    yield
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    description="Smart Attendance System REST API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME, "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
