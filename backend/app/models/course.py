from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class CourseCreate(BaseModel):
    code: str = Field(..., min_length=2, examples=["CS-101"])
    name: str = Field(..., min_length=2, examples=["Data Structures"])
    description: Optional[str] = ""
    instructor: str = Field(..., examples=["Dr. Smith"])
    schedule: Optional[str] = Field("", examples=["Mon/Wed 10:00 AM"])
    credit_hours: int = Field(default=3, ge=1, le=6)


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    schedule: Optional[str] = None
    credit_hours: Optional[int] = Field(None, ge=1, le=6)


class CourseResponse(BaseModel):
    id: str
    code: str
    name: str
    description: str
    instructor: str
    schedule: str
    credit_hours: int
    enrolled_students: List[str] = []
    total_students: int = 0
    created_at: datetime


class EnrollRequest(BaseModel):
    student_ids: List[str]


class UnenrollRequest(BaseModel):
    student_id: str
