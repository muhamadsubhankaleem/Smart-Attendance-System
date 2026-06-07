from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional
import io
from app.db.mongodb import get_db
from app.services.report_service import (
    get_overview_stats, get_course_report, get_student_report, export_csv_data,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/overview", summary="System-wide attendance overview stats")
async def overview(db=Depends(get_db), _=Depends(get_current_user)):
    return await get_overview_stats(db)


@router.get("/course/{course_id}", summary="Per-course attendance report")
async def course_report(course_id: str, db=Depends(get_db), _=Depends(get_current_user)):
    return await get_course_report(db, course_id)


@router.get("/student/{student_id}", summary="Per-student attendance report")
async def student_report(student_id: str, db=Depends(get_db), _=Depends(get_current_user)):
    return await get_student_report(db, student_id)


@router.get("/export/csv", summary="Export attendance report as CSV")
async def export_csv(
    course_id: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    db=Depends(get_db),
    _=Depends(get_current_user),
):
    csv_data = await export_csv_data(db, course_id, student_id)
    name = f"report_{'course' if course_id else 'student'}.csv"
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={name}"},
    )
