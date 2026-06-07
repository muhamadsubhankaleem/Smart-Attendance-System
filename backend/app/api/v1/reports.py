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


@router.get("/overview", summary="System-wide attendance overview stats (supports date filtering)")
async def overview(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date:   Optional[str] = Query(None, description="YYYY-MM-DD"),
    db=Depends(get_db),
    _=Depends(get_current_user),
):
    return await get_overview_stats(db, start_date, end_date)


@router.get("/course/{course_id}", summary="Per-course attendance report with optional date filter")
async def course_report(
    course_id: str,
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date:   Optional[str] = Query(None, description="YYYY-MM-DD"),
    db=Depends(get_db),
    _=Depends(get_current_user),
):
    return await get_course_report(db, course_id, start_date, end_date)


@router.get("/student/{student_id}", summary="Per-student attendance report with optional date filter")
async def student_report(
    student_id: str,
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date:   Optional[str] = Query(None, description="YYYY-MM-DD"),
    db=Depends(get_db),
    _=Depends(get_current_user),
):
    return await get_student_report(db, student_id, start_date, end_date)


@router.get("/export/csv", summary="Export report as CSV (course or student, supports date filter)")
async def export_csv(
    course_id:  Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date:   Optional[str] = Query(None, description="YYYY-MM-DD"),
    db=Depends(get_db),
    _=Depends(get_current_user),
):
    csv_data = await export_csv_data(db, course_id, student_id, start_date, end_date)
    name = f"attendance_{'course' if course_id else 'student'}_report.csv"
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={name}"},
    )
