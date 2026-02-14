from datetime import datetime

from sqlmodel import Field, SQLModel


class Message(SQLModel, table=True):
    __tablename__ = "messages"
    message_id: int | None = Field(primary_key=True, index=True)
    subject: str
    body: str
    sender_id: int = Field(foreign_key="users.user_id")
    recipient_type: str  # "player" | "division" | "league"
    recipient_id: int | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MessageRecipient(SQLModel, table=True):
    __tablename__ = "message_recipients"
    id: int | None = Field(primary_key=True)
    message_id: int = Field(foreign_key="messages.message_id")
    player_id: int = Field(foreign_key="players.player_id")
    read_at: datetime | None = Field(default=None)
