import os
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlmodel import Session

from models import User
from services.database import get_session

GOOGLE_CLIENT_ID = os.environ.get("OPL_GOOGLE_CLIENT_ID", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

ADMIN_EMAIL = "admin@csopl.com"
DEMO_MODE = os.environ.get("DEMO_MODE", "").lower() == "true"
DEMO_PLAYER_EMAIL = os.environ.get("DEMO_PLAYER_EMAIL", "demo@csopl.com")

security = HTTPBearer()


def verify_google_token(credential: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="OPL_GOOGLE_CLIENT_ID not configured")
    try:
        idinfo = id_token.verify_oauth2_token(
            credential, google_requests.Request(), GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=5,
        )
        return idinfo
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}") from e


def create_jwt(user: User) -> str:
    payload = {
        "user_id": user.user_id,
        "email": user.email,
        "is_admin": user.is_admin,
        "exp": datetime.now(UTC) + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    try:
        payload = jwt.decode(
            credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM]
        )
        user_id = payload.get("user_id")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from None

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_non_demo(user: User = Depends(get_current_user)) -> User:
    if DEMO_MODE:
        raise HTTPException(status_code=403, detail="Demo mode: read-only")
    return user
