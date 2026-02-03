from typing import Optional

from sqlmodel import SQLModel, Field


class Player(SQLModel, table=True):
    __tablename__ = "players"
    player_id: Optional[int] = Field(primary_key=True, index=True)
    division_id: Optional[int]
    first_name: str
    last_name: str
    rating: int = Field(default=600)
    games_played: int = Field(default=0)
    phone: str
    email: str
