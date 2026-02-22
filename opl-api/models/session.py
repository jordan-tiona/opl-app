from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class Session(SQLModel, table=True):
    __tablename__ = "sessions"
    session_id: int | None = Field(primary_key=True, index=True)
    name: str
    match_time: str  # HH:MM
    active: bool = Field(default=True)


class SessionResponse(BaseModel):
    session_id: int
    name: str
    match_time: str
    active: bool
    start_date: str | None = None
    end_date: str | None = None
