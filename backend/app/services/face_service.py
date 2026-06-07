"""
Face Recognition Service
Requirements:
  pip install face-recognition opencv-python numpy
  (Windows: also install cmake and Visual C++ Build Tools)

Endpoints:
  POST /face/register   — Admin registers a student face from base64 image
  POST /face/recognize  — Camera frame → auto-mark attendance
  GET  /face/status     — Check if module is available
"""

import base64
import io
import numpy as np
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException

try:
    import face_recognition
    import cv2
    FACE_AVAILABLE = True
except ImportError:
    FACE_AVAILABLE = False


def _require():
    if not FACE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail=(
                "Face recognition is not installed. "
                "Run: pip install face-recognition opencv-python"
            ),
        )


def _decode_image(image_b64: str) -> np.ndarray:
    """Decode base64 image string → RGB numpy array."""
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]
    img_bytes = base64.b64decode(image_b64)
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Cannot decode image. Send a valid JPEG/PNG.")
    return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


async def register_face(db, student_id: str, image_b64: str) -> dict:
    _require()
    try:
        s_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    student = await db.students.find_one({"_id": s_oid})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    rgb = _decode_image(image_b64)
    locations = face_recognition.face_locations(rgb)
    if not locations:
        raise HTTPException(status_code=400, detail="No face detected. Please use a clear photo.")
    if len(locations) > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected. Use an image with a single face.")

    encoding = face_recognition.face_encodings(rgb, locations)[0].tolist()
    await db.face_encodings.update_one(
        {"student_id": s_oid},
        {"$set": {
            "student_id": s_oid,
            "student_name": student["name"],
            "roll_number": student["roll_number"],
            "encoding": encoding,
            "updated_at": datetime.utcnow(),
        }},
        upsert=True,
    )
    return {
        "message": f"Face registered for {student['name']}",
        "student_id": student_id,
        "student_name": student["name"],
    }


async def recognize_and_mark(db, image_b64: str, course_id: str, session_date: str) -> dict:
    _require()
    try:
        c_oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")

    rgb = _decode_image(image_b64)
    locations = face_recognition.face_locations(rgb)
    if not locations:
        raise HTTPException(status_code=400, detail="No face detected in the frame")

    unknown_enc = face_recognition.face_encodings(rgb, locations)[0]

    all_enc_docs = await db.face_encodings.find().to_list(2000)
    if not all_enc_docs:
        raise HTTPException(status_code=404, detail="No registered faces. Register students first.")

    known_encs = [np.array(d["encoding"]) for d in all_enc_docs]
    known_ids = [d["student_id"] for d in all_enc_docs]
    known_names = [d["student_name"] for d in all_enc_docs]

    matches = face_recognition.compare_faces(known_encs, unknown_enc, tolerance=0.55)
    distances = face_recognition.face_distance(known_encs, unknown_enc)

    if not any(matches):
        raise HTTPException(status_code=404, detail="Face not recognised. Please register first.")

    best = int(np.argmin(distances))
    matched_id = known_ids[best]
    matched_name = known_names[best]
    confidence = round((1 - float(distances[best])) * 100, 1)

    student = await db.students.find_one({"_id": matched_id})
    if not student or c_oid not in student.get("enrolled_courses", []):
        raise HTTPException(status_code=403, detail=f"{matched_name} is not enrolled in this course")

    existing = await db.attendance_sessions.find_one({"course_id": c_oid, "date": session_date})
    if existing:
        if any(r["student_id"] == matched_id for r in existing.get("records", [])):
            raise HTTPException(status_code=400, detail=f"{matched_name} is already marked present")
        await db.attendance_sessions.update_one(
            {"_id": existing["_id"]},
            {"$push": {"records": {"student_id": matched_id, "status": "present"}}},
        )
    else:
        await db.attendance_sessions.insert_one({
            "course_id": c_oid,
            "date": session_date,
            "records": [{"student_id": matched_id, "status": "present"}],
            "notes": "Auto-marked via face recognition",
            "created_by": matched_id,
            "created_at": datetime.utcnow(),
        })

    course = await db.courses.find_one({"_id": c_oid})
    return {
        "message": f"✅ Attendance marked for {matched_name}",
        "student_id": str(matched_id),
        "student_name": matched_name,
        "confidence": confidence,
        "course_name": course["name"] if course else "Unknown",
        "date": session_date,
        "status": "present",
    }
