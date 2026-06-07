from fastapi import APIRouter
from app.api.v1 import auth, students, courses, attendance, qr_attendance, reports, face_recognition

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth.router)
v1_router.include_router(students.router)
v1_router.include_router(courses.router)
v1_router.include_router(attendance.router)
v1_router.include_router(qr_attendance.router)
v1_router.include_router(reports.router)
v1_router.include_router(face_recognition.router)
