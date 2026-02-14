import jwt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from services.auth import (
    ADMIN_EMAIL,
    create_jwt,
    get_current_user,
    verify_google_token,
)
from services.database import get_session
from models import User

router = APIRouter(prefix="/auth")


class LoginRequest(BaseModel):
    credential: str


class LoginResponse(BaseModel):
    token: str
    user: User


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, session: Session = Depends(get_session)):
    decoded = jwt.decode(request.credential, options={"verify_signature": False})
    print(decoded)
    idinfo = verify_google_token(request.credential)
    email = idinfo["email"]

    user = session.exec(select(User).where(User.email == email)).first()

    if not user and email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Account not found. Contact an admin to be added.")

    if not user:
        # Auto-create admin user on first login
        user = User(
            email=email,
            is_admin=True,
            google_id=idinfo["sub"],
            name=idinfo.get("name"),
            picture=idinfo.get("picture"),
        )
        session.add(user)
    else:
        # Link/update Google info
        user.google_id = idinfo["sub"]
        if idinfo.get("name"):
            user.name = idinfo["name"]
        if idinfo.get("picture"):
            user.picture = idinfo["picture"]

    session.commit()
    session.refresh(user)

    token = create_jwt(user)
    return LoginResponse(token=token, user=user)


@router.get("/me", response_model=User)
def get_me(user: User = Depends(get_current_user)):
    return user
