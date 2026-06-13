from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, Integer, String
from app.db import Base


# ── SQLAlchemy ORM Models ──
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_code = Column(String(20), unique=True, nullable=False, index=True)
    course_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_name = Column(String(100), nullable=False)
    course_code = Column(String(20), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    status = Column(String(20), nullable=False)  # present, absent, late


# ── Pydantic Schemas ──
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str = "user"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    description: str | None = None


class CourseResponse(BaseModel):
    id: int
    course_code: str
    course_name: str
    description: str | None

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    student_name: str
    course_code: str
    date: str
    status: str


class AttendanceResponse(BaseModel):
    id: int
    student_name: str
    course_code: str
    date: str
    status: str

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_students: int
    active_courses: int
    attendance_rate: float
    sessions_today: int

