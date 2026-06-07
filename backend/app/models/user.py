from pydantic import BaseModel, EmailStr, Field
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    student = "student"


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["John Doe"])
    email: EmailStr
    password: str = Field(..., min_length=6, examples=["securepassword"])
    role: UserRole = UserRole.student


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
