from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

import bcrypt

# Password hashing using bcrypt directly (no passlib)

def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt.
    Returns the hashed password as a UTF-8 string.
    """
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hashed password."""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# ─── JWT Tokens ───────────────────────────────────────────────────────────────

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a short-lived JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a long-lived JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify a JWT. Raises JWTError on invalid/expired tokens."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


# ─── QR Code Tokens ───────────────────────────────────────────────────────────

def create_qr_token(data: Dict[str, Any]) -> str:
    """Create a 5-minute QR attendance token signed with a separate key."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.QR_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "qr_attendance"})
    return jwt.encode(to_encode, settings.QR_SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_qr_token(token: str) -> Dict[str, Any]:
    """Decode a QR token. Raises JWTError on failure."""
    payload = jwt.decode(token, settings.QR_SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != "qr_attendance":
        raise JWTError("Invalid QR token type")
    return payload
