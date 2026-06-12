from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException, status
from typing import List, Optional
from app.models.student import StudentCreate, StudentUpdate, StudentResponse


def _to_resp(s: dict) -> StudentResponse:
    return StudentResponse(
        id=str(s["_id"]),
        roll_number=s["roll_number"],
        name=s["name"],
        email=s["email"],
        department=s.get("department", ""),  # fallback for old docs
        semester=s["semester"],
        phone=s.get("phone"),
        enrolled_courses=[str(c) for c in s.get("enrolled_courses", [])],
        created_at=s["created_at"],
    )


async def get_all_students(
    db,
    search: Optional[str] = None,
    department: Optional[str] = None,
) -> List[StudentResponse]:
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"roll_number": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    if department:
        query["department"] = {"$regex": department, "$options": "i"}
    students = await db.students.find(query).sort("name", 1).to_list(1000)
    return [_to_resp(s) for s in students]


async def get_student_by_id(db, student_id: str) -> StudentResponse:
    try:
        obj_id = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    s = await db.students.find_one({"_id": obj_id})
    if not s:
        raise HTTPException(status_code=404, detail="Student not found")
    return _to_resp(s)


async def create_student(db, data: StudentCreate) -> StudentResponse:
    if await db.students.find_one({"$or": [{"roll_number": data.roll_number}, {"email": data.email}]}):
        raise HTTPException(status_code=400, detail="Roll number or email already exists")
    doc = {**data.model_dump(), "enrolled_courses": [], "created_at": datetime.utcnow()}
    result = await db.students.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_resp(doc)


async def update_student(db, student_id: str, data: StudentUpdate) -> StudentResponse:
    try:
        obj_id = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.students.update_one({"_id": obj_id}, {"$set": fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return await get_student_by_id(db, student_id)


async def delete_student(db, student_id: str) -> dict:
    try:
        obj_id = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")
    result = await db.students.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    # Remove from all courses
    await db.courses.update_many({}, {"$pull": {"enrolled_students": obj_id}})
    return {"message": "Student deleted successfully"}


async def get_student_stats(db) -> dict:
    total = await db.students.count_documents({})
    pipeline = [{"$group": {"_id": "$department", "count": {"$sum": 1}}}]
    by_dept = {}
    async for doc in db.students.aggregate(pipeline):
        by_dept[doc["_id"]] = doc["count"]
    return {"total": total, "by_department": by_dept}
