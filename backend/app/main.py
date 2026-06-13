import sys, os
# ── Fix Python path so "from app.xxx" works no matter how you launch ──
# Adds the "backend" directory to sys.path so Python finds the "app" package.
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import v1_router
from app.core.config import settings
from app.db.mongodb import connect_db, close_db, get_db
from app.db.indexes import create_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    await connect_db()
    db = await get_db()
    await create_indexes(db)
    print(f"[OK] {settings.APP_NAME} API is running")
    yield
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Full-stack Smart Attendance System REST API\n\n"
        "Features: JWT Auth • Student CRUD • Course Management • "
        "Attendance Tracking • QR Code Attendance • Reports • Face Recognition"
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME, "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
