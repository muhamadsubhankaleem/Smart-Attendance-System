from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from bson import ObjectId
from app.core.security import decode_token
from app.db.mongodb import get_db

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db=Depends(get_db),
):
    """Validate JWT from Authorization header and return the user document."""
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if not user_id or payload.get("type") != "access":
            raise exc
    except JWTError:
        raise exc

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise exc
    return user


async def require_admin(current_user=Depends(get_current_user)):
    """Guard: only admin users pass through."""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


async def require_student(current_user=Depends(get_current_user)):
    """Guard: only student users pass through."""
    if current_user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access only",
        )
    return current_user
