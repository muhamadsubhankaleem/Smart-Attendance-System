from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


class StudentCreate(BaseModel):
    roll_number: str = Field(..., min_length=2, examples=["CS-001"])
    name: str = Field(..., min_length=2, examples=["Alice Smith"])
    email: EmailStr
    department: str = Field(..., examples=["Computer Science"])
    semester: int = Field(..., ge=1, le=8)
    phone: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=8)
    phone: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    roll_number: str
    name: str
    email: str
    department: str
    semester: int
    phone: Optional[str] = None
    enrolled_courses: List[str] = []
    created_at: datetime
