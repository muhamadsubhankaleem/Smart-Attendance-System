from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime
from enum import Enum


class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"


class AttendanceRecord(BaseModel):
    student_id: str
    status: AttendanceStatus


class SessionCreate(BaseModel):
    course_id: str
    date: date
    records: List[AttendanceRecord]
    notes: Optional[str] = ""


class SessionUpdate(BaseModel):
    records: List[AttendanceRecord]
    notes: Optional[str] = None


class AttendanceRecordResponse(BaseModel):
    student_id: str
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    status: str


class SessionResponse(BaseModel):
    id: str
    course_id: str
    course_name: Optional[str] = None
    course_code: Optional[str] = None
    date: str
    records: List[AttendanceRecordResponse]
    notes: str = ""
    total_present: int = 0
    total_absent: int = 0
    total_late: int = 0
    created_by: str
    created_at: datetime
