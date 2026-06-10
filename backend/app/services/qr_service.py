"""
QR Code Attendance Service
- Generates a QR code image (base64) containing a 5-minute JWT
- Students scan QR → token validated → attendance marked
- Duplicate scans prevented via scanned_students list
- MongoDB TTL index auto-deletes expired QR sessions
"""

import qrcode
import base64
import io
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import HTTPException
from jose import JWTError
from app.core.security import create_qr_token, decode_qr_token
from app.core.config import settings


async def generate_qr_session(db, course_id: str, session_date: str, created_by: str) -> dict:
    try:
        c_oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")

    course = await db.courses.find_one({"_id": c_oid})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Invalidate any previous QR for this course+date
    await db.qr_sessions.delete_many({"course_id": c_oid, "session_date": session_date})

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.QR_EXPIRE_MINUTES)
    qr_token = create_qr_token({
        "course_id": course_id,
        "session_date": session_date,
        "created_by": created_by,
    })

    doc = {
        "course_id": c_oid,
        "course_name": course["name"],
        "session_date": session_date,
        "qr_token": qr_token,
        "expires_at": expires_at,
        "scanned_students": [],
        "created_by": ObjectId(created_by),
        "created_at": datetime.utcnow(),
    }
    result = await db.qr_sessions.insert_one(doc)

    # Generate QR PNG → base64
    qr = qrcode.QRCode(version=1, box_size=10, border=4,
                       error_correction=qrcode.constants.ERROR_CORRECT_L)
    qr.add_data(qr_token)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1e1b4b", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    img_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "id": str(result.inserted_id),
        "course_id": course_id,
        "course_name": course["name"],
        "session_date": session_date,
        "qr_token": qr_token,
        "qr_image_base64": f"data:image/png;base64,{img_b64}",
        "expires_at": expires_at.isoformat(),
        "expire_minutes": settings.QR_EXPIRE_MINUTES,
        "scanned_students": [],
        "created_at": doc["created_at"].isoformat(),
    }


async def mark_attendance_by_qr(db, qr_token: str, student_id: str) -> dict:
    try:
        s_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    # Validate QR token
    try:
        payload = decode_qr_token(qr_token)
    except JWTError:
        raise HTTPException(status_code=400, detail="QR code is invalid or has expired")

    course_id = payload["course_id"]
    session_date = payload["session_date"]
    try:
        c_oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed QR payload")

    # Verify student exists and is enrolled
    student = await db.students.find_one({"_id": s_oid})
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if c_oid not in student.get("enrolled_courses", []):
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")

    # Locate active QR session
    qr_session = await db.qr_sessions.find_one({"course_id": c_oid, "session_date": session_date})
    if not qr_session:
        raise HTTPException(status_code=404, detail="QR session not found or already expired")

    now = datetime.now(timezone.utc)
    exp = qr_session["expires_at"].replace(tzinfo=timezone.utc) if qr_session["expires_at"].tzinfo is None else qr_session["expires_at"]
    if now > exp:
        raise HTTPException(status_code=400, detail="QR code has expired. Ask the admin for a new one.")

    if s_oid in qr_session.get("scanned_students", []):
        raise HTTPException(status_code=400, detail="You have already marked attendance for this session")

    # Upsert attendance session record
    existing = await db.attendance_sessions.find_one({"course_id": c_oid, "date": session_date})
    if existing:
        already = any(r["student_id"] == s_oid for r in existing.get("records", []))
        if already:
            await db.attendance_sessions.update_one(
                {"_id": existing["_id"], "records.student_id": s_oid},
                {"$set": {"records.$.status": "present"}},
            )
        else:
            await db.attendance_sessions.update_one(
                {"_id": existing["_id"]},
                {"$push": {"records": {"student_id": s_oid, "status": "present"}}},
            )
    else:
        await db.attendance_sessions.insert_one({
            "course_id": c_oid,
            "date": session_date,
            "records": [{"student_id": s_oid, "status": "present"}],
            "notes": "Auto-marked via QR scan",
            "created_by": qr_session["created_by"],
            "created_at": datetime.utcnow(),
        })

    await db.qr_sessions.update_one(
        {"_id": qr_session["_id"]},
        {"$addToSet": {"scanned_students": s_oid}},
    )

    course = await db.courses.find_one({"_id": c_oid})
    return {
        "message": f"✅ Attendance marked successfully for {student['name']}",
        "student_name": student["name"],
        "course_name": course["name"] if course else "Unknown",
        "date": session_date,
        "status": "present",
    }
