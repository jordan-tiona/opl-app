from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


class Match(SQLModel, table=True):
    __tablename__ = "matches"
    match_id: Optional[int] = Field(primary_key=True)
    player1_id: int = Field(foreign_key="players.player_id")
    player2_id: int = Field(foreign_key="players.player_id")
    scheduled_date: datetime
    completed: bool
