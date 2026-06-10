from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.db.mongodb import get_db
from app.models.student import StudentCreate, StudentUpdate, StudentResponse
from app.services.student_service import (
    get_all_students, get_student_by_id, create_student,
    update_student, delete_student, get_student_stats,
)
from app.core.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/", response_model=List[StudentResponse], summary="List all students (admin)")
async def list_students(
    search: Optional[str] = Query(None, description="Search by name, roll number, or email"),
    department: Optional[str] = Query(None),
    db=Depends(get_db),
    _=Depends(require_admin),
):
    return await get_all_students(db, search, department)


@router.get("/stats", summary="Student statistics (admin)")
async def stats(db=Depends(get_db), _=Depends(require_admin)):
    return await get_student_stats(db)


@router.post("/", response_model=StudentResponse, status_code=201, summary="Create student (admin)")
async def create(data: StudentCreate, db=Depends(get_db), _=Depends(require_admin)):
    return await create_student(db, data)


@router.get("/{student_id}", response_model=StudentResponse, summary="Get student by ID")
async def get_one(student_id: str, db=Depends(get_db), _=Depends(get_current_user)):
    return await get_student_by_id(db, student_id)


@router.put("/{student_id}", response_model=StudentResponse, summary="Update student (admin)")
async def update(student_id: str, data: StudentUpdate, db=Depends(get_db), _=Depends(require_admin)):
    return await update_student(db, student_id, data)


@router.delete("/{student_id}", summary="Delete student (admin)")
async def delete(student_id: str, db=Depends(get_db), _=Depends(require_admin)):
    return await delete_student(db, student_id)
