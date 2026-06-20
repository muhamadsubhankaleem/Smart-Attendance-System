from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app.models import (
    User, UserCreate, UserLogin, UserResponse, TokenResponse,
    Course, CourseCreate, CourseResponse,
    Student, StudentCreate, StudentResponse,
    Attendance, AttendanceCreate, AttendanceResponse, StatsResponse,
    CourseReportRow, StudentReportRow,
    SystemSetting, SystemSettingResponse, SystemSettingUpdate
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


# ── Students Endpoints ──
@router.get("/students", response_model=list[StudentResponse])
async def get_students(token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    result = await db.execute(select(Student))
    return result.scalars().all()


@router.post("/students", response_model=StudentResponse)
async def create_student(body: StudentCreate, token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    existing = await db.execute(select(Student).where(Student.student_id == body.student_id))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Student ID already exists")
    
    student = Student(
        student_id=body.student_id,
        full_name=body.full_name,
        email=body.email,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student


# ── Attendance Endpoints ──
@router.get("/attendance", response_model=list[AttendanceResponse])
async def get_attendance(token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    stmt = (
        select(Attendance, Student.full_name)
        .join(Student, Attendance.student_id == Student.student_id)
        .order_by(Attendance.id.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    output = []
    for att, name in rows:
        output.append(AttendanceResponse(
            id=att.id,
            student_id=att.student_id,
            student_name=name,
            course_code=att.course_code,
            date=att.date,
            status=att.status
        ))
    return output


@router.post("/attendance", response_model=AttendanceResponse)
async def create_attendance(body: AttendanceCreate, token: str = "", force: bool = False, db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    if body.status not in ["present", "absent", "late"]:
        raise HTTPException(400, "Invalid attendance status. Must be present, absent, or late")
    
    course_exist = await db.execute(select(Course).where(Course.course_code == body.course_code))
    if not course_exist.scalar_one_or_none():
        raise HTTPException(400, f"Course with code '{body.course_code}' does not exist")
        
    student_exist = await db.execute(select(Student).where(Student.student_id == body.student_id))
    student = student_exist.scalar_one_or_none()
    if not student:
        raise HTTPException(400, f"Student with ID '{body.student_id}' does not exist")

    # Duplicate check unless force is True
    if not force:
        existing_att = await db.execute(
            select(Attendance)
            .where(
                Attendance.student_id == body.student_id,
                Attendance.course_code == body.course_code,
                Attendance.date == body.date
            )
        )
        if existing_att.scalar_one_or_none():
            raise HTTPException(409, f"Attendance already logged for this student in {body.course_code} on {body.date}.")
    
    attendance = Attendance(
        student_id=body.student_id,
        course_code=body.course_code,
        date=body.date,
        status=body.status,
    )
    db.add(attendance)
    await db.commit()
    await db.refresh(attendance)
    
    return AttendanceResponse(
        id=attendance.id,
        student_id=attendance.student_id,
        student_name=student.full_name,
        course_code=attendance.course_code,
        date=attendance.date,
        status=attendance.status
    )


@router.get("/stats", response_model=StatsResponse)
async def get_stats(token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    
    # 1. Total active students (registered in students table)
    res_students = await db.execute(select(func.count(Student.id)))
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
        attendance_rate = 100.0
        
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


# ── Reports Endpoints ──
@router.get("/reports/course/{course_code}", response_model=list[CourseReportRow])
async def get_course_report(course_code: str, token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    
    course_res = await db.execute(select(Course).where(Course.course_code == course_code))
    if not course_res.scalar_one_or_none():
        raise HTTPException(400, f"Course with code '{course_code}' does not exist")
        
    students_res = await db.execute(select(Student))
    students = students_res.scalars().all()
    
    report = []
    for s in students:
        stmt = select(Attendance).where(
            (Attendance.student_id == s.student_id) & 
            (Attendance.course_code == course_code)
        )
        logs_res = await db.execute(stmt)
        logs = logs_res.scalars().all()
        
        total = len(logs)
        present = sum(1 for l in logs if l.status == "present")
        late = sum(1 for l in logs if l.status == "late")
        absent = sum(1 for l in logs if l.status == "absent")
        
        rate = round(((present + late) / total) * 100.0, 1) if total > 0 else 100.0
        
        report.append(CourseReportRow(
            student_id=s.student_id,
            student_name=s.full_name,
            total_classes=total,
            present_count=present,
            late_count=late,
            absent_count=absent,
            attendance_rate=rate
        ))
        
    return report


@router.get("/reports/student/{student_id}", response_model=list[StudentReportRow])
async def get_student_report(student_id: str, token: str = "", db: AsyncSession = Depends(get_db)):
    verify_auth(token)
    
    student_res = await db.execute(select(Student).where(Student.student_id == student_id))
    if not student_res.scalar_one_or_none():
        raise HTTPException(400, f"Student with ID '{student_id}' does not exist")
        
    courses_res = await db.execute(select(Course))
    courses = courses_res.scalars().all()
    
    report = []
    for c in courses:
        stmt = select(Attendance).where(
            (Attendance.student_id == student_id) & 
            (Attendance.course_code == c.course_code)
        )
        logs_res = await db.execute(stmt)
        logs = logs_res.scalars().all()
        
        total = len(logs)
        present = sum(1 for l in logs if l.status == "present")
        late = sum(1 for l in logs if l.status == "late")
        absent = sum(1 for l in logs if l.status == "absent")
        
        rate = round(((present + late) / total) * 100.0, 1) if total > 0 else 100.0
        
        report.append(StudentReportRow(
            course_code=c.course_code,
            course_name=c.course_name,
            total_classes=total,
            present_count=present,
            late_count=late,
            absent_count=absent,
            attendance_rate=rate
        ))
        
    return report
