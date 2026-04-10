
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlmodel import Session as DBSession
from sqlmodel import select

from models import Match, Session, User
from models.session import SessionResponse
from services.auth import get_current_user, require_admin
from services.database import get_session


class SessionUpdate(BaseModel):
    name: str
    match_time: str | None
    dues: int = 10
    active: bool
    update_existing_matches: bool = False

router = APIRouter(
    prefix="/sessions"
)


def _build_session_responses(session: DBSession, sessions: list[Session]) -> list[SessionResponse]:
    if not sessions:
        return []

    session_ids = [s.session_id for s in sessions]
    rows = session.exec(
        select(
            Match.session_id,
            func.min(Match.scheduled_date).label("start_date"),
            func.max(Match.scheduled_date).label("end_date"),
        )
        .where(Match.session_id.in_(session_ids))
        .group_by(Match.session_id)
    ).all()
    date_map = {r.session_id: (str(r.start_date.date()), str(r.end_date.date())) for r in rows}

    return [
        SessionResponse(
            session_id=s.session_id,
            name=s.name,
            match_time=s.match_time,
            dues=s.dues,
            active=s.active,
            deleted=s.deleted,
            start_date=date_map.get(s.session_id, (None, None))[0],
            end_date=date_map.get(s.session_id, (None, None))[1],
        )
        for s in sessions
    ]


@router.get("/", response_model=list[SessionResponse])
def get_sessions(active: bool | None = None, session: DBSession = Depends(get_session), _user: User = Depends(get_current_user)):
    query = select(Session).where(Session.deleted == False)  # noqa: E712
    if active is not None:
        query = query.where(Session.active == active)
    sessions = session.exec(query).all()
    return _build_session_responses(session, list(sessions))


@router.get("/{session_id}/", response_model=SessionResponse)
def get_session_by_id(session_id: int, session: DBSession = Depends(get_session), _user: User = Depends(get_current_user)):
    s = session.get(Session, session_id)
    if not s or s.deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return _build_session_responses(session, [s])[0]


@router.post("/", response_model=SessionResponse)
def create_session(body: Session, session: DBSession = Depends(get_session), _admin: User = Depends(require_admin)):
    session.add(body)
    session.commit()
    session.refresh(body)
    return _build_session_responses(session, [body])[0]


@router.put("/{session_id}/", response_model=SessionResponse)
def update_session(session_id: int, body: SessionUpdate, session: DBSession = Depends(get_session), _admin: User = Depends(require_admin)):
    db_session = session.get(Session, session_id)
    if not db_session or db_session.deleted:
        raise HTTPException(status_code=404, detail="Session not found")

    db_session.name = body.name
    db_session.match_time = body.match_time
    db_session.dues = body.dues
    db_session.active = body.active

    if body.update_existing_matches and body.match_time is not None:
        h, m = map(int, body.match_time.split(':'))
        matches = session.exec(
            select(Match).where(
                Match.session_id == session_id,
                Match.completed == False,  # noqa: E712
                Match.deleted == False,  # noqa: E712
            )
        ).all()
        for match in matches:
            match.scheduled_date = match.scheduled_date.replace(hour=h, minute=m, second=0, microsecond=0)
            session.add(match)

    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return _build_session_responses(session, [db_session])[0]


@router.delete("/{session_id}/")
def delete_session(session_id: int, session: DBSession = Depends(get_session), _admin: User = Depends(require_admin)):
    db_session = session.get(Session, session_id)
    if not db_session or db_session.deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    db_session.deleted = True
    session.add(db_session)
    # Cascade: soft-delete all matches for this session
    matches = session.exec(
        select(Match).where(Match.session_id == session_id, Match.deleted == False)  # noqa: E712
    ).all()
    for m in matches:
        m.deleted = True
        session.add(m)
    session.commit()
    return {"ok": True}
