from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException
from typing import List, Optional
from app.models.attendance import SessionCreate, SessionUpdate, SessionResponse, AttendanceRecordResponse


async def _enrich(db, session: dict) -> SessionResponse:
    course = await db.courses.find_one({"_id": session["course_id"]})
    present = absent = late = 0
    records = []
    for rec in session.get("records", []):
        student = await db.students.find_one({"_id": rec["student_id"]})
        s = rec["status"]
        if s == "present": present += 1
        elif s == "absent": absent += 1
        elif s == "late": late += 1
        records.append(AttendanceRecordResponse(
            student_id=str(rec["student_id"]),
            student_name=student["name"] if student else "Unknown",
            roll_number=student.get("roll_number", "N/A") if student else "N/A",
            status=s,
        ))
    return SessionResponse(
        id=str(session["_id"]),
        course_id=str(session["course_id"]),
        course_name=course["name"] if course else None,
        course_code=course["code"] if course else None,
        date=str(session["date"]),
        records=records,
        notes=session.get("notes", ""),
        total_present=present,
        total_absent=absent,
        total_late=late,
        created_by=str(session["created_by"]),
        created_at=session["created_at"],
    )


async def create_session(db, data: SessionCreate, created_by: str) -> SessionResponse:
    try:
        c_oid = ObjectId(data.course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    if await db.attendance_sessions.find_one({"course_id": c_oid, "date": str(data.date)}):
        raise HTTPException(status_code=400, detail="Session already exists for this course and date")
    records = [{"student_id": ObjectId(r.student_id), "status": r.status.value} for r in data.records]
    doc = {
        "course_id": c_oid,
        "date": str(data.date),
        "records": records,
        "notes": data.notes or "",
        "created_by": ObjectId(created_by),
        "created_at": datetime.utcnow(),
    }
    result = await db.attendance_sessions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await _enrich(db, doc)


async def get_all_sessions(
    db,
    course_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[SessionResponse]:
    query = {}
    if course_id:
        try:
            query["course_id"] = ObjectId(course_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid course ID")
    date_filter = {}
    if start_date:
        date_filter["$gte"] = start_date
    if end_date:
        date_filter["$lte"] = end_date
    if date_filter:
        query["date"] = date_filter
    sessions = await db.attendance_sessions.find(query).sort("date", -1).to_list(500)
    return [await _enrich(db, s) for s in sessions]


async def get_session_by_id(db, session_id: str) -> SessionResponse:
    try:
        obj_id = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    session = await db.attendance_sessions.find_one({"_id": obj_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return await _enrich(db, session)


async def update_session(db, session_id: str, data: SessionUpdate) -> SessionResponse:
    try:
        obj_id = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    update_doc: dict = {
        "records": [{"student_id": ObjectId(r.student_id), "status": r.status.value} for r in data.records]
    }
    if data.notes is not None:
        update_doc["notes"] = data.notes
    result = await db.attendance_sessions.update_one({"_id": obj_id}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return await get_session_by_id(db, session_id)


async def delete_session(db, session_id: str) -> dict:
    try:
        obj_id = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    result = await db.attendance_sessions.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}


async def get_student_attendance(db, student_id: str, course_id: Optional[str] = None) -> list:
    try:
        s_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    query = {"records.student_id": s_oid}
    if course_id:
        try:
            query["course_id"] = ObjectId(course_id)
        except Exception:
            pass
    sessions = await db.attendance_sessions.find(query).sort("date", -1).to_list(1000)
    result = []
    for session in sessions:
        course = await db.courses.find_one({"_id": session["course_id"]})
        for rec in session.get("records", []):
            if rec["student_id"] == s_oid:
                result.append({
                    "session_id": str(session["_id"]),
                    "course_id": str(session["course_id"]),
                    "course_name": course["name"] if course else "Unknown",
                    "course_code": course["code"] if course else "N/A",
                    "date": session["date"],
                    "status": rec["status"],
                })
    return result


async def get_attendance_stats(db) -> dict:
    total_sessions = await db.attendance_sessions.count_documents({})
    status_counts = {"present": 0, "absent": 0, "late": 0}
    async for doc in db.attendance_sessions.aggregate([
        {"$unwind": "$records"},
        {"$group": {"_id": "$records.status", "count": {"$sum": 1}}}
    ]):
        status_counts[doc["_id"]] = doc["count"]
    total = sum(status_counts.values())
    rate = round((status_counts["present"] + status_counts["late"]) / total * 100, 1) if total > 0 else 0
    return {"total_sessions": total_sessions, "attendance_rate": rate, "status_counts": status_counts}
