from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from auth import get_current_user, require_admin
from database import get_session
from models import (
    DivisionPlayer,
    Message,
    MessageRecipient,
    User,
)

router = APIRouter(prefix="/messages")


class MessageCreate(BaseModel):
    subject: str
    body: str
    recipient_type: str  # "player" | "division" | "league"
    recipient_id: int | None = None
    player_ids: list[int] | None = None  # for multi-player targeting


class MessageOut(BaseModel):
    message_id: int
    subject: str
    body: str
    sender_id: int
    recipient_type: str
    recipient_id: int | None
    created_at: datetime
    is_read: bool


@router.post("/")
def create_message(
    data: MessageCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    if data.recipient_type == "player":
        if not data.player_ids:
            raise HTTPException(status_code=400, detail="player_ids required for player messages")
        msg = Message(
            subject=data.subject,
            body=data.body,
            sender_id=admin.user_id,
            recipient_type="player",
            recipient_id=None,
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)
        for pid in data.player_ids:
            session.add(MessageRecipient(message_id=msg.message_id, player_id=pid))
        session.commit()
        return msg
    else:
        msg = Message(
            subject=data.subject,
            body=data.body,
            sender_id=admin.user_id,
            recipient_type=data.recipient_type,
            recipient_id=data.recipient_id,
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)
        return msg


@router.get("/", response_model=list[MessageOut])
def list_messages(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    if not user.player_id:
        if user.is_admin:
            # Admin sees all messages
            messages = session.exec(
                select(Message).order_by(Message.created_at.desc())
            ).all()
            return [
                MessageOut(
                    message_id=m.message_id,
                    subject=m.subject,
                    body=m.body,
                    sender_id=m.sender_id,
                    recipient_type=m.recipient_type,
                    recipient_id=m.recipient_id,
                    created_at=m.created_at,
                    is_read=True,
                )
                for m in messages
            ]
        raise HTTPException(status_code=400, detail="No player linked to this user")

    player_id = user.player_id

    # Get division IDs for this player
    div_ids = [
        dp.division_id
        for dp in session.exec(
            select(DivisionPlayer).where(DivisionPlayer.player_id == player_id)
        ).all()
    ]

    # Get all messages for this player
    # 1. Direct player messages via MessageRecipient
    direct_msg_ids = [
        mr.message_id
        for mr in session.exec(
            select(MessageRecipient).where(MessageRecipient.player_id == player_id)
        ).all()
    ]

    # 2. Division messages
    # 3. League messages
    all_messages = []

    if direct_msg_ids:
        direct = session.exec(
            select(Message).where(Message.message_id.in_(direct_msg_ids))
        ).all()
        all_messages.extend(direct)

    if div_ids:
        div_messages = session.exec(
            select(Message).where(
                Message.recipient_type == "division",
                Message.recipient_id.in_(div_ids),
            )
        ).all()
        all_messages.extend(div_messages)

    league_messages = session.exec(
        select(Message).where(Message.recipient_type == "league")
    ).all()
    all_messages.extend(league_messages)

    # Deduplicate by message_id
    seen = set()
    unique_messages = []
    for m in all_messages:
        if m.message_id not in seen:
            seen.add(m.message_id)
            unique_messages.append(m)

    # Sort by created_at desc
    unique_messages.sort(key=lambda m: m.created_at, reverse=True)

    # Get read status
    read_map = {}
    if unique_messages:
        msg_ids = [m.message_id for m in unique_messages]
        recipients = session.exec(
            select(MessageRecipient).where(
                MessageRecipient.message_id.in_(msg_ids),
                MessageRecipient.player_id == player_id,
            )
        ).all()
        read_map = {r.message_id: r.read_at is not None for r in recipients}

    return [
        MessageOut(
            message_id=m.message_id,
            subject=m.subject,
            body=m.body,
            sender_id=m.sender_id,
            recipient_type=m.recipient_type,
            recipient_id=m.recipient_id,
            created_at=m.created_at,
            is_read=read_map.get(m.message_id, False),
        )
        for m in unique_messages
    ]


@router.get("/{message_id}/")
def get_message(
    message_id: int,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
):
    msg = session.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    return msg


@router.put("/{message_id}/read/")
def mark_read(
    message_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    if not user.player_id:
        raise HTTPException(status_code=400, detail="No player linked to this user")

    msg = session.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    recipient = session.exec(
        select(MessageRecipient).where(
            MessageRecipient.message_id == message_id,
            MessageRecipient.player_id == user.player_id,
        )
    ).first()

    if recipient:
        if not recipient.read_at:
            recipient.read_at = datetime.utcnow()
            session.add(recipient)
            session.commit()
    else:
        # Create read tracking row for division/league messages
        session.add(
            MessageRecipient(
                message_id=message_id,
                player_id=user.player_id,
                read_at=datetime.utcnow(),
            )
        )
        session.commit()

    return {"ok": True}


@router.delete("/{message_id}/")
def delete_message(
    message_id: int,
    session: Session = Depends(get_session),
    _admin: User = Depends(require_admin),
):
    msg = session.get(Message, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    # Delete associated recipients
    recipients = session.exec(
        select(MessageRecipient).where(MessageRecipient.message_id == message_id)
    ).all()
    for r in recipients:
        session.delete(r)

    session.delete(msg)
    session.commit()
    return {"ok": True}
