
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as DBSession, select

from auth import get_current_user, require_admin
from database import get_session
from models import Session, User


router = APIRouter(
    prefix="/sessions"
)


@router.get("/", response_model=list[Session])
def get_sessions(active: bool | None = None, session: DBSession = Depends(get_session), _user: User = Depends(get_current_user)):
    query = select(Session)
    if active is not None:
        query = query.where(Session.active == active)
    return session.exec(query).all()


@router.get("/{session_id}/", response_model=Session)
def get_session_by_id(session_id: int, session: DBSession = Depends(get_session), _user: User = Depends(get_current_user)):
    s = session.get(Session, session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


@router.post("/", response_model=Session)
def create_session(body: Session, session: DBSession = Depends(get_session), _admin: User = Depends(require_admin)):
    session.add(body)
    session.commit()
    session.refresh(body)
    return body


@router.put("/{session_id}/", response_model=Session)
def update_session(session_id: int, body: Session, session: DBSession = Depends(get_session), _admin: User = Depends(require_admin)):
    db_session = session.get(Session, session_id)
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    for key, value in body.model_dump(exclude={"session_id"}).items():
        setattr(db_session, key, value)
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session
