from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class Session(SQLModel, table=True):
    __tablename__ = "sessions"
    session_id: int | None = Field(primary_key=True, index=True)
    name: str
    match_time: str | None = Field(default=None)  # HH:MM; None=flexible (no specific time)
    active: bool = Field(default=True)
    deleted: bool = Field(default=False)


class SessionResponse(BaseModel):
    session_id: int
    name: str
    match_time: str | None
    active: bool
    deleted: bool
    start_date: str | None = None
    end_date: str | None = None
