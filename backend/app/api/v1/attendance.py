from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from app.db.mongodb import get_db
from app.models.attendance import SessionCreate, SessionUpdate, SessionResponse
from app.services.attendance_service import (
    create_session, get_all_sessions, get_session_by_id,
    update_session, delete_session, get_student_attendance, get_attendance_stats,
)
from app.core.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/sessions", response_model=SessionResponse, status_code=201)
async def create(data: SessionCreate, db=Depends(get_db), current_user=Depends(require_admin)):
    return await create_session(db, data, str(current_user["_id"]))


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    course_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db=Depends(get_db),
    _=Depends(require_admin),
):
    return await get_all_sessions(db, course_id, start_date, end_date)


@router.get("/stats")
async def stats(db=Depends(get_db), _=Depends(require_admin)):
    return await get_attendance_stats(db)


@router.get("/student/{student_id}")
async def student_attendance(
    student_id: str,
    course_id: Optional[str] = Query(None),
    db=Depends(get_db),
    _=Depends(get_current_user),
):
    return await get_student_attendance(db, student_id, course_id)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_one(session_id: str, db=Depends(get_db), _=Depends(require_admin)):
    return await get_session_by_id(db, session_id)


@router.put("/sessions/{session_id}", response_model=SessionResponse)
async def update(session_id: str, data: SessionUpdate, db=Depends(get_db), _=Depends(require_admin)):
    return await update_session(db, session_id, data)


@router.delete("/sessions/{session_id}")
async def delete(session_id: str, db=Depends(get_db), _=Depends(require_admin)):
    return await delete_session(db, session_id)
