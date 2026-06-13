from motor.motor_asyncio import AsyncIOMotorDatabase


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    """Create all required MongoDB indexes on application startup."""
    # Users
    await db.users.create_index("email", unique=True)

    # Students
    await db.students.create_index("roll_number", unique=True)
    await db.students.create_index("email", unique=True)

    # Courses
    await db.courses.create_index("code", unique=True)

    # Attendance sessions — compound index for fast lookup
    await db.attendance_sessions.create_index([("course_id", 1), ("date", 1)])

    # QR sessions — TTL index auto-deletes expired QR tokens
    await db.qr_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.qr_sessions.create_index([("course_id", 1), ("session_date", 1)])

    # Face encodings
    await db.face_encodings.create_index("student_id", unique=True)

    print("[OK] MongoDB indexes ready")
