from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Game(SQLModel, table=True):
    __tablename__ = "games"
    game_id: Optional[int] = Field(primary_key=True)
    match_id: int = Field(foreign_key="matches.match_id")
    winner_id: int = Field(foreign_key="players.player_id")
    loser_id: int = Field(foreign_key="players.player_id")
    winner_rating: int
    loser_rating: int
    balls_remaining: int
    played_date: datetime
