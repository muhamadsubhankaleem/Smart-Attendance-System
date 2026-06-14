import sys, os

# Add backend dir to path so "from app.xxx" works when running directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import init_db, close_db
from app.api import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
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


@app.get("/", tags=["Root"]) 
async def root():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print(tb)  # Print to terminal
    return JSONResponse(status_code=500, content={"detail": str(exc), "traceback": tb})


@app.get("/api/v1/attendance", tags=["Attendance"])
async def get_attendance():
    """Return mock attendance records for frontend demonstration."""
    sample = [
        {"date": "2026-06-01", "student": "Alice Smith", "course": "Math 101", "status": "Present", "remarks": ""},
        {"date": "2026-06-01", "student": "Bob Jones", "course": "Math 101", "status": "Absent", "remarks": "Sick"},
        {"date": "2026-06-02", "student": "Charlie Brown", "course": "Physics 201", "status": "Present", "remarks": ""},
        {"date": "2026-06-02", "student": "Dana Lee", "course": "Physics 201", "status": "Late", "remarks": "Traffic"},
    ]
    return sample


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
