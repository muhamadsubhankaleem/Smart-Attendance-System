from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException, status
from jose import JWTError
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.models.user import UserCreate, UserLogin, TokenResponse, UserResponse


def _user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"],
    )


def _build_tokens(user: dict) -> TokenResponse:
    payload = {"sub": str(user["_id"]), "role": user["role"]}
    return TokenResponse(
        access_token=create_access_token(payload),
        refresh_token=create_refresh_token(payload),
        user=_user_to_response(user),
    )


async def register_user(db, data: UserCreate) -> TokenResponse:
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )
    doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": data.role.value,
        "is_active": True,
        "created_at": datetime.utcnow(),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _build_tokens(doc)


async def login_user(db, data: UserLogin) -> TokenResponse:
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")
    return _build_tokens(user)


async def refresh_access_token(db, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return _build_tokens(user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


async def get_me(current_user: dict) -> UserResponse:
    return _user_to_response(current_user)
