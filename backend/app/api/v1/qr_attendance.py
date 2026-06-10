from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.db.mongodb import get_db
from app.services.qr_service import generate_qr_session, mark_attendance_by_qr
from app.core.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/qr", tags=["QR Attendance"])


class QRGenerateRequest(BaseModel):
    course_id: str
    session_date: str  # YYYY-MM-DD


class QRMarkRequest(BaseModel):
    qr_token: str


@router.post("/generate", summary="Generate QR code for attendance session (admin, expires 5 min)")
async def generate_qr(
    data: QRGenerateRequest,
    db=Depends(get_db),
    current_user=Depends(require_admin),
):
    return await generate_qr_session(db, data.course_id, data.session_date, str(current_user["_id"]))


@router.post("/mark", summary="Student scans QR to mark attendance")
async def mark_by_qr(
    data: QRMarkRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    # Resolve the linked student document from the authenticated user's email
    student = await db.students.find_one({"email": current_user["email"]})
    if not student:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Student profile not linked to your account. Contact admin.")
    return await mark_attendance_by_qr(db, data.qr_token, str(student["_id"]))


@router.get("/session/{course_id}/{session_date}", summary="Get QR session info (admin)")
async def qr_session_info(course_id: str, session_date: str, db=Depends(get_db), _=Depends(require_admin)):
    from bson import ObjectId
    from fastapi import HTTPException
    try:
        c_oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    session = await db.qr_sessions.find_one({"course_id": c_oid, "session_date": session_date})
    if not session:
        raise HTTPException(status_code=404, detail="QR session not found")
    return {
        "id": str(session["_id"]),
        "course_id": str(session["course_id"]),
        "course_name": session.get("course_name"),
        "session_date": session["session_date"],
        "expires_at": session["expires_at"].isoformat(),
        "scanned_count": len(session.get("scanned_students", [])),
    }
