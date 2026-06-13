from fastapi import APIRouter, HTTPException, Depends
from app.db import get_db
from app.models import UserCreate, UserLogin, UserResponse, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: UserCreate, db=Depends(get_db)):
    if db is None:
        raise HTTPException(503, "Database not available")

    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(400, "Email already registered")

    user_doc = {
        "full_name": body.full_name,
        "email": body.email,
        "password": hash_password(body.password),
        "role": "user",
    }
    result = await db.users.insert_one(user_doc)

    user = UserResponse(
        id=str(result.inserted_id),
        full_name=body.full_name,
        email=body.email,
        role="user",
    )
    token = create_access_token({"sub": user.email, "role": user.role})
    return TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db=Depends(get_db)):
    if db is None:
        raise HTTPException(503, "Database not available")

    user_doc = await db.users.find_one({"email": body.email})
    if not user_doc or not verify_password(body.password, user_doc["password"]):
        raise HTTPException(401, "Invalid email or password")

    user = UserResponse(
        id=str(user_doc["_id"]),
        full_name=user_doc["full_name"],
        email=user_doc["email"],
        role=user_doc.get("role", "user"),
    )
    token = create_access_token({"sub": user.email, "role": user.role})
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserResponse)
async def get_me(token: str = "", db=Depends(get_db)):
    if db is None:
        raise HTTPException(503, "Database not available")

    payload = decode_token(token)
    if not payload:
        raise HTTPException(401, "Invalid or expired token")

    user_doc = await db.users.find_one({"email": payload.get("sub")})
    if not user_doc:
        raise HTTPException(404, "User not found")

    return UserResponse(
        id=str(user_doc["_id"]),
        full_name=user_doc["full_name"],
        email=user_doc["email"],
        role=user_doc.get("role", "user"),
    )
