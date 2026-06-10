from fastapi import APIRouter, Depends
from typing import List
from app.db.mongodb import get_db
from app.models.course import CourseCreate, CourseUpdate, CourseResponse, EnrollRequest, UnenrollRequest
from app.services.course_service import (
    get_all_courses, get_course_by_id, create_course,
    update_course, delete_course, enroll_students, unenroll_student, get_course_stats,
)
from app.core.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get("/", response_model=List[CourseResponse], summary="List all courses")
async def list_courses(db=Depends(get_db), _=Depends(get_current_user)):
    return await get_all_courses(db)


@router.get("/stats", summary="Course statistics (admin)")
async def stats(db=Depends(get_db), _=Depends(require_admin)):
    return await get_course_stats(db)


@router.post("/", response_model=CourseResponse, status_code=201, summary="Create course (admin)")
async def create(data: CourseCreate, db=Depends(get_db), _=Depends(require_admin)):
    return await create_course(db, data)


@router.get("/{course_id}", response_model=CourseResponse, summary="Get course by ID")
async def get_one(course_id: str, db=Depends(get_db), _=Depends(get_current_user)):
    return await get_course_by_id(db, course_id)


@router.put("/{course_id}", response_model=CourseResponse, summary="Update course (admin)")
async def update(course_id: str, data: CourseUpdate, db=Depends(get_db), _=Depends(require_admin)):
    return await update_course(db, course_id, data)


@router.delete("/{course_id}", summary="Delete course (admin)")
async def delete(course_id: str, db=Depends(get_db), _=Depends(require_admin)):
    return await delete_course(db, course_id)


@router.post("/{course_id}/enroll", response_model=CourseResponse, summary="Enroll students (admin)")
async def enroll(course_id: str, data: EnrollRequest, db=Depends(get_db), _=Depends(require_admin)):
    return await enroll_students(db, course_id, data)


@router.post("/{course_id}/unenroll", response_model=CourseResponse, summary="Unenroll student (admin)")
async def unenroll(course_id: str, data: UnenrollRequest, db=Depends(get_db), _=Depends(require_admin)):
    return await unenroll_student(db, course_id, data)
