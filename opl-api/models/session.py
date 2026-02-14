from sqlmodel import Field, SQLModel


class Session(SQLModel, table=True):
    __tablename__ = "sessions"
    session_id: int | None = Field(primary_key=True, index=True)
    name: str
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD
    match_time: str  # HH:MM
    active: bool = Field(default=True)
