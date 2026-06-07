"""
Report Service — aggregation queries, date-range filtering, CSV export, overview stats
"""

from bson import ObjectId
from fastapi import HTTPException
from typing import Optional
import csv
import io


async def get_overview_stats(db, start_date: Optional[str] = None, end_date: Optional[str] = None) -> dict:
    session_query = {}
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        session_query["date"] = date_filter

    total_students = await db.students.count_documents({})
    total_courses  = await db.courses.count_documents({})
    total_sessions = await db.attendance_sessions.count_documents(session_query)

    pipeline = [
        {"$match": session_query},
        {"$unwind": "$records"},
        {"$group": {"_id": "$records.status", "count": {"$sum": 1}}}
    ]
    status_counts = {"present": 0, "absent": 0, "late": 0}
    async for doc in db.attendance_sessions.aggregate(pipeline):
        status_counts[doc["_id"]] = doc["count"]

    total_records = sum(status_counts.values())
    rate = round((status_counts["present"] + status_counts["late"]) / total_records * 100, 1) if total_records > 0 else 0

    # Daily trend for the filtered period (last 30 days max)
    trend_pipeline = [
        {"$match": session_query},
        {"$unwind": "$records"},
        {"$group": {
            "_id": {"date": "$date", "status": "$records.status"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.date": 1}},
    ]
    trend_raw: dict = {}
    async for doc in db.attendance_sessions.aggregate(trend_pipeline):
        d = doc["_id"]["date"]
        s = doc["_id"]["status"]
        if d not in trend_raw:
            trend_raw[d] = {"present": 0, "absent": 0, "late": 0}
        trend_raw[d][s] = doc["count"]

    trend = [{"date": d, **v} for d, v in sorted(trend_raw.items())]

    # Recent 5 sessions
    recent = []
    async for s in db.attendance_sessions.find(session_query).sort("date", -1).limit(5):
        course = await db.courses.find_one({"_id": s["course_id"]})
        records = s.get("records", [])
        present_count = sum(1 for r in records if r["status"] in ("present", "late"))
        recent.append({
            "session_id": str(s["_id"]),
            "course_name": course["name"] if course else "Unknown",
            "course_code": course["code"] if course else "N/A",
            "date": s["date"],
            "total_records": len(records),
            "present_count": present_count,
            "attendance_rate": round(present_count / len(records) * 100, 1) if records else 0,
        })

    return {
        "total_students": total_students,
        "total_courses": total_courses,
        "total_sessions": total_sessions,
        "attendance_rate": rate,
        "status_counts": status_counts,
        "daily_trend": trend,
        "recent_sessions": recent,
    }


async def get_course_report(
    db,
    course_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    try:
        c_oid = ObjectId(course_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid course ID")

    course = await db.courses.find_one({"_id": c_oid})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    session_query: dict = {"course_id": c_oid}
    if start_date or end_date:
        date_filter: dict = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        session_query["date"] = date_filter

    sessions = await db.attendance_sessions.find(session_query).sort("date", 1).to_list(1000)
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

    # Daily session data for chart
    daily = []
    for s in sessions:
        records = s.get("records", [])
        present = sum(1 for r in records if r["status"] in ("present", "late"))
        daily.append({
            "date": s["date"],
            "present": present,
            "absent": len(records) - present,
            "total": len(records),
            "rate": round(present / len(records) * 100, 1) if records else 0,
        })

    return {
        "course_id": course_id,
        "course_name": course["name"],
        "course_code": course["code"],
        "instructor": course["instructor"],
        "schedule": course.get("schedule", ""),
        "total_sessions": len(sessions),
        "student_stats": enriched,
        "avg_attendance": avg,
        "daily_sessions": daily,
        "date_range": {"start": start_date, "end": end_date},
    }


async def get_student_report(
    db,
    student_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> dict:
    try:
        s_oid = ObjectId(student_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid student ID")

    student = await db.students.find_one({"_id": s_oid})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    session_query: dict = {"records.student_id": s_oid}
    if start_date or end_date:
        date_filter: dict = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        session_query["date"] = date_filter

    course_stats: dict = {}
    timeline = []

    async for session in db.attendance_sessions.find(session_query).sort("date", 1):
        cid = str(session["course_id"])
        if cid not in course_stats:
            course_stats[cid] = {"present": 0, "absent": 0, "late": 0, "total": 0}
        for rec in session.get("records", []):
            if rec["student_id"] == s_oid:
                st = rec["status"]
                course_stats[cid][st] = course_stats[cid].get(st, 0) + 1
                course_stats[cid]["total"] += 1
                timeline.append({
                    "date": session["date"],
                    "course_id": cid,
                    "status": st,
                })

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
        "attendance_timeline": timeline,
        "date_range": {"start": start_date, "end": end_date},
    }


async def export_csv_data(
    db,
    course_id: Optional[str] = None,
    student_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    if course_id:
        rpt = await get_course_report(db, course_id, start_date, end_date)
        writer.writerow(["Smart Attendance System — Course Report"])
        writer.writerow(["Generated", f"{start_date or 'All time'} to {end_date or 'today'}"])
        writer.writerow([])
        writer.writerow(["Course", rpt["course_name"], "Code", rpt["course_code"], "Instructor", rpt["instructor"]])
        writer.writerow(["Total Sessions", rpt["total_sessions"], "Avg Attendance", f"{rpt['avg_attendance']}%"])
        writer.writerow([])
        writer.writerow(["Roll Number", "Student Name", "Present", "Absent", "Late", "Total Sessions", "Attendance %"])
        for s in rpt["student_stats"]:
            writer.writerow([s["roll_number"], s["student_name"], s["present"], s["absent"], s["late"], s["total"], f"{s['percentage']}%"])

        # Daily sessions section
        if rpt.get("daily_sessions"):
            writer.writerow([])
            writer.writerow(["Daily Session Breakdown"])
            writer.writerow(["Date", "Present", "Absent", "Total", "Rate %"])
            for d in rpt["daily_sessions"]:
                writer.writerow([d["date"], d["present"], d["absent"], d["total"], f"{d['rate']}%"])

    elif student_id:
        rpt = await get_student_report(db, student_id, start_date, end_date)
        writer.writerow(["Smart Attendance System — Student Report"])
        writer.writerow(["Generated", f"{start_date or 'All time'} to {end_date or 'today'}"])
        writer.writerow([])
        writer.writerow(["Student", rpt["student_name"], "Roll No", rpt["roll_number"]])
        writer.writerow(["Department", rpt["department"], "Semester", rpt["semester"]])
        writer.writerow(["Overall Attendance", f"{rpt['overall_percentage']}%"])
        writer.writerow([])
        writer.writerow(["Course Code", "Course Name", "Present", "Absent", "Late", "Total Sessions", "Attendance %"])
        for c in rpt["course_stats"]:
            writer.writerow([c["course_code"], c["course_name"], c["present"], c["absent"], c["late"], c["total_sessions"], f"{c['percentage']}%"])

    return output.getvalue()
