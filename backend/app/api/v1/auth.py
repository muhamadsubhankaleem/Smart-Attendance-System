from fastapi import APIRouter, Depends, status
from app.db.mongodb import get_db
from app.models.user import UserCreate, UserLogin, RefreshRequest, TokenResponse, UserResponse
from app.services.auth_service import register_user, login_user, refresh_access_token, get_me
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED,
             summary="Register a new Admin or Student account")
async def register(data: UserCreate, db=Depends(get_db)):
    return await register_user(db, data)


@router.post("/login", response_model=TokenResponse, summary="Login and receive JWT tokens")
async def login(data: UserLogin, db=Depends(get_db)):
    return await login_user(db, data)


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh(data: RefreshRequest, db=Depends(get_db)):
    return await refresh_access_token(db, data.refresh_token)


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def me(current_user=Depends(get_current_user)):
    return await get_me(current_user)
