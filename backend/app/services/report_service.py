"""
Report Service — aggregation queries, CSV export, PDF export, overview stats
"""

from bson import ObjectId
from fastapi import HTTPException
from typing import Optional
import csv
import io


async def get_overview_stats(db) -> dict:
    total_students = await db.students.count_documents({})
    total_courses = await db.courses.count_documents({})
    total_sessions = await db.attendance_sessions.count_documents({})

    status_counts = {"present": 0, "absent": 0, "late": 0}
    async for doc in db.attendance_sessions.aggregate([
        {"$unwind": "$records"},
        {"$group": {"_id": "$records.status", "count": {"$sum": 1}}}
    ]):
        status_counts[doc["_id"]] = doc["count"]

    total_records = sum(status_counts.values())
    rate = round((status_counts["present"] + status_counts["late"]) / total_records * 100, 1) if total_records > 0 else 0

    # Recent 5 sessions
    recent = []
    async for s in db.attendance_sessions.find().sort("created_at", -1).limit(5):
        course = await db.courses.find_one({"_id": s["course_id"]})
        recent.append({
            "session_id": str(s["_id"]),
            "course_name": course["name"] if course else "Unknown",
            "course_code": course["code"] if course else "N/A",
            "date": s["date"],
            "total_records": len(s.get("records", [])),
        })

    return {
        "total_students": total_students,
        "total_courses": total_courses,
        "total_sessions": total_sessions,
        "attendance_rate": rate,
        "status_counts": status_counts,
        "recent_sessions": recent,
    }


async def get_course_report(db, course_id: str) -> dict:
    try:
        c_oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")

    course = await db.courses.find_one({"_id": c_oid})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    sessions = await db.attendance_sessions.find({"course_id": c_oid}).to_list(1000)
    student_stats: dict = {}

    for session in sessions:
        for rec in session.get("records", []):
            sid = str(rec["student_id"])
            if sid not in student_stats:
                student_stats[sid] = {"present": 0, "absent": 0, "late": 0}
            student_stats[sid][rec["status"]] = student_stats[sid].get(rec["status"], 0) + 1

    enriched = []
    for sid, stats in student_stats.items():
        try:
            student = await db.students.find_one({"_id": ObjectId(sid)})
        except Exception:
            student = None
        total = stats["present"] + stats["absent"] + stats.get("late", 0)
        attended = stats["present"] + stats.get("late", 0)
        pct = round(attended / total * 100, 1) if total > 0 else 0
        enriched.append({
            "student_id": sid,
            "student_name": student["name"] if student else "Unknown",
            "roll_number": student.get("roll_number", "N/A") if student else "N/A",
            "present": stats["present"],
            "absent": stats["absent"],
            "late": stats.get("late", 0),
            "total": total,
            "percentage": pct,
        })
    enriched.sort(key=lambda x: x["student_name"])
    avg = round(sum(s["percentage"] for s in enriched) / len(enriched), 1) if enriched else 0

    return {
        "course_id": course_id,
        "course_name": course["name"],
        "course_code": course["code"],
        "instructor": course["instructor"],
        "total_sessions": len(sessions),
        "student_stats": enriched,
        "avg_attendance": avg,
    }


async def get_student_report(db, student_id: str) -> dict:
    try:
        s_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    student = await db.students.find_one({"_id": s_oid})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    course_stats: dict = {}
    async for session in db.attendance_sessions.find({"records.student_id": s_oid}):
        cid = str(session["course_id"])
        if cid not in course_stats:
            course_stats[cid] = {"present": 0, "absent": 0, "late": 0, "total": 0}
        for rec in session.get("records", []):
            if rec["student_id"] == s_oid:
                st = rec["status"]
                course_stats[cid][st] = course_stats[cid].get(st, 0) + 1
                course_stats[cid]["total"] += 1

    enriched = []
    for cid, stats in course_stats.items():
        try:
            course = await db.courses.find_one({"_id": ObjectId(cid)})
        except Exception:
            course = None
        attended = stats["present"] + stats.get("late", 0)
        pct = round(attended / stats["total"] * 100, 1) if stats["total"] > 0 else 0
        enriched.append({
            "course_id": cid,
            "course_name": course["name"] if course else "Unknown",
            "course_code": course["code"] if course else "N/A",
            "present": stats["present"],
            "absent": stats["absent"],
            "late": stats.get("late", 0),
            "total_sessions": stats["total"],
            "percentage": pct,
        })

    overall = round(sum(c["percentage"] for c in enriched) / len(enriched), 1) if enriched else 0
    return {
        "student_id": student_id,
        "student_name": student["name"],
        "roll_number": student["roll_number"],
        "department": student["department"],
        "semester": student["semester"],
        "course_stats": enriched,
        "overall_percentage": overall,
    }


async def export_csv_data(
    db, course_id: Optional[str] = None, student_id: Optional[str] = None
) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    if course_id:
        rpt = await get_course_report(db, course_id)
        writer.writerow(["Smart Attendance System — Course Report"])
        writer.writerow(["Course", rpt["course_name"], "Code", rpt["course_code"], "Instructor", rpt["instructor"]])
        writer.writerow(["Total Sessions", rpt["total_sessions"], "Avg Attendance", f"{rpt['avg_attendance']}%"])
        writer.writerow([])
        writer.writerow(["Roll Number", "Student Name", "Present", "Absent", "Late", "Total", "Attendance %"])
        for s in rpt["student_stats"]:
            writer.writerow([s["roll_number"], s["student_name"], s["present"], s["absent"], s["late"], s["total"], f"{s['percentage']}%"])
    elif student_id:
        rpt = await get_student_report(db, student_id)
        writer.writerow(["Smart Attendance System — Student Report"])
        writer.writerow(["Student", rpt["student_name"], "Roll No", rpt["roll_number"], "Dept", rpt["department"]])
        writer.writerow(["Overall Attendance", f"{rpt['overall_percentage']}%"])
        writer.writerow([])
        writer.writerow(["Course Code", "Course Name", "Present", "Absent", "Late", "Total Sessions", "Attendance %"])
        for c in rpt["course_stats"]:
            writer.writerow([c["course_code"], c["course_name"], c["present"], c["absent"], c["late"], c["total_sessions"], f"{c['percentage']}%"])
    return output.getvalue()
