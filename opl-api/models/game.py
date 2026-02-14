from datetime import datetime

from sqlmodel import Field, SQLModel


class Game(SQLModel, table=True):
    __tablename__ = "games"
    game_id: int | None = Field(primary_key=True)
    match_id: int = Field(foreign_key="matches.match_id")
    winner_id: int = Field(foreign_key="players.player_id")
    loser_id: int = Field(foreign_key="players.player_id")
    winner_rating: int
    loser_rating: int
    winner_rating_change: int
    loser_rating_change: int
    balls_remaining: int
    played_date: datetime
