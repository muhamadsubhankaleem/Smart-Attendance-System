from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models import (
    User, UserCreate, UserLogin, UserResponse, TokenResponse,
    Course, CourseCreate, CourseResponse,
    Attendance, AttendanceCreate, AttendanceResponse, StatsResponse
)
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from datetime import date

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    # Create new user
    user = User(
        full_name=body.full_name,
        email=body.email,
        password=hash_password(body.password),
        role="user",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, full_name=user.full_name, email=user.email, role=user.role),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password):
        raise HTTPException(401, "Invalid email or password")

    token = create_access_token({"sub": user.email, "role": user.role})
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, full_name=user.full_name, email=user.email, role=user.role),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(token: str = "", db: AsyncSession = Depends(get_db)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")

    result = await db.execute(select(User).where(User.email == payload.get("sub")))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    return UserResponse(id=user.id, full_name=user.full_name, email=user.email, role=user.role)


# ── Courses Endpoints ──
def verify_auth(token: str):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")
    return payload


@router.get("/courses", response_model=list[CourseResponse])
async def get_courses(token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    result = await db.execute(select(Course))
    return result.scalars().all()


@router.post("/courses", response_model=CourseResponse)
async def create_course(body: CourseCreate, token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    existing = await db.execute(select(Course).where(Course.course_code == body.course_code))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Course code already exists")
    
    course = Course(
        course_code=body.course_code,
        course_name=body.course_name,
        description=body.description,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


# ── Attendance Endpoints ──
@router.get("/attendance", response_model=list[AttendanceResponse])
async def get_attendance(token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    result = await db.execute(select(Attendance).order_by(Attendance.id.desc()))
    return result.scalars().all()


@router.post("/attendance", response_model=AttendanceResponse)
async def create_attendance(body: AttendanceCreate, token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    if body.status not in ["present", "absent", "late"]:
        raise HTTPException(400, "Invalid attendance status. Must be present, absent, or late")
    
    course_exist = await db.execute(select(Course).where(Course.course_code == body.course_code))
    if not course_exist.scalar_one_or_none():
        raise HTTPException(400, f"Course with code '{body.course_code}' does not exist")
    
    attendance = Attendance(
        student_name=body.student_name,
        course_code=body.course_code,
        date=body.date,
        status=body.status,
    )
    db.add(attendance)
    await db.commit()
    await db.refresh(attendance)
    return attendance


@router.get("/stats", response_model=StatsResponse)
async def get_stats(token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    
    # 1. Total unique students
    res_students = await db.execute(select(func.count(func.distinct(Attendance.student_name))))
    total_students = res_students.scalar() or 0
    
    # 2. Total active courses
    res_courses = await db.execute(select(func.count(Course.id)))
    active_courses = res_courses.scalar() or 0
    
    # 3. Attendance rate (%) = (present + late) / total
    res_total = await db.execute(select(func.count(Attendance.id)))
    total_att = res_total.scalar() or 0
    
    if total_att > 0:
        res_present = await db.execute(select(func.count(Attendance.id)).where(Attendance.status.in_(["present", "late"])))
        present_att = res_present.scalar() or 0
        attendance_rate = round((present_att / total_att) * 100.0, 1)
    else:
        attendance_rate = 100.0  # Default to 100%
        
    # 4. Sessions today (count of unique courses attended today)
    today_str = date.today().isoformat()
    res_sessions = await db.execute(select(func.count(func.distinct(Attendance.course_code))).where(Attendance.date == today_str))
    sessions_today = res_sessions.scalar() or 0
    
    return StatsResponse(
        total_students=total_students,
        active_courses=active_courses,
        attendance_rate=attendance_rate,
        sessions_today=sessions_today,
    )
