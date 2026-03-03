from datetime import datetime

from sqlmodel import Field, SQLModel


class Match(SQLModel, table=True):
    __tablename__ = "matches"
    match_id: int | None = Field(primary_key=True)
    session_id: int | None = Field(default=None, foreign_key="sessions.session_id")
    division_id: int = Field(foreign_key="divisions.division_id")
    player1_id: int = Field(foreign_key="players.player_id")
    player2_id: int | None = Field(default=None, foreign_key="players.player_id")
    is_bye: bool = Field(default=False)
    player1_rating: int
    player2_rating: int | None = Field(default=None)
    player1_weight: int = Field(default=0)
    player2_weight: int | None = Field(default=None)
    scheduled_date: datetime
    completed: bool
    reminder_sent: bool = Field(default=False)
    winner_id: int | None = Field(default=None, foreign_key="players.player_id")
    loser_id: int | None = Field(default=None, foreign_key="players.player_id")
    deleted: bool = Field(default=False)
