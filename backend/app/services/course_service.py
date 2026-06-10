from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException
from typing import List
from app.models.course import CourseCreate, CourseUpdate, CourseResponse, EnrollRequest, UnenrollRequest


def _to_resp(c: dict) -> CourseResponse:
    enrolled = c.get("enrolled_students", [])
    return CourseResponse(
        id=str(c["_id"]),
        code=c["code"],
        name=c["name"],
        description=c.get("description", ""),
        instructor=c["instructor"],
        schedule=c.get("schedule", ""),
        credit_hours=c.get("credit_hours", 3),
        enrolled_students=[str(s) for s in enrolled],
        total_students=len(enrolled),
        created_at=c["created_at"],
    )


async def get_all_courses(db) -> List[CourseResponse]:
    courses = await db.courses.find().sort("name", 1).to_list(1000)
    return [_to_resp(c) for c in courses]


async def get_course_by_id(db, course_id: str) -> CourseResponse:
    try:
        obj_id = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    c = await db.courses.find_one({"_id": obj_id})
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
    return _to_resp(c)


async def create_course(db, data: CourseCreate) -> CourseResponse:
    if await db.courses.find_one({"code": data.code}):
        raise HTTPException(status_code=400, detail="Course code already exists")
    doc = {**data.model_dump(), "enrolled_students": [], "created_at": datetime.utcnow()}
    result = await db.courses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _to_resp(doc)


async def update_course(db, course_id: str, data: CourseUpdate) -> CourseResponse:
    try:
        obj_id = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.courses.update_one({"_id": obj_id}, {"$set": fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return await get_course_by_id(db, course_id)


async def delete_course(db, course_id: str) -> dict:
    try:
        obj_id = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")
    result = await db.courses.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.students.update_many({}, {"$pull": {"enrolled_courses": obj_id}})
    return {"message": "Course deleted successfully"}


async def enroll_students(db, course_id: str, data: EnrollRequest) -> CourseResponse:
    try:
        c_oid = ObjectId(course_id)
        s_oids = [ObjectId(sid) for sid in data.student_ids]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if not await db.courses.find_one({"_id": c_oid}):
        raise HTTPException(status_code=404, detail="Course not found")
    await db.courses.update_one(
        {"_id": c_oid}, {"$addToSet": {"enrolled_students": {"$each": s_oids}}}
    )
    await db.students.update_many(
        {"_id": {"$in": s_oids}}, {"$addToSet": {"enrolled_courses": c_oid}}
    )
    return await get_course_by_id(db, course_id)


async def unenroll_student(db, course_id: str, data: UnenrollRequest) -> CourseResponse:
    try:
        c_oid = ObjectId(course_id)
        s_oid = ObjectId(data.student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    await db.courses.update_one({"_id": c_oid}, {"$pull": {"enrolled_students": s_oid}})
    await db.students.update_one({"_id": s_oid}, {"$pull": {"enrolled_courses": c_oid}})
    return await get_course_by_id(db, course_id)


async def get_course_stats(db) -> dict:
    total = await db.courses.count_documents({})
    pipeline = [
        {"$project": {"count": {"$size": "$enrolled_students"}}},
        {"$group": {"_id": None, "avg": {"$avg": "$count"}, "max": {"$max": "$count"}}},
    ]
    result = await db.courses.aggregate(pipeline).to_list(1)
    avg = round(result[0]["avg"], 1) if result else 0
    return {"total": total, "avg_students_per_course": avg}
