from typing import Optional

from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    __tablename__ = "users"
    user_id: Optional[int] = Field(primary_key=True, index=True)
    email: str = Field(unique=True, index=True)
    google_id: Optional[str] = Field(default=None)
    name: Optional[str] = Field(default=None)
    picture: Optional[str] = Field(default=None)
    is_admin: bool = Field(default=False)
    player_id: Optional[int] = Field(default=None, foreign_key="players.player_id")
