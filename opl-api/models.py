from datetime import datetime

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    __tablename__ = "users"
    user_id: int | None = Field(primary_key=True, index=True)
    email: str = Field(unique=True, index=True)
    google_id: str | None = Field(default=None)
    name: str | None = Field(default=None)
    picture: str | None = Field(default=None)
    is_admin: bool = Field(default=False)
    player_id: int | None = Field(default=None, foreign_key="players.player_id")


class Player(SQLModel, table=True):
    __tablename__ = "players"
    player_id: int | None = Field(primary_key=True, index=True)
    first_name: str
    last_name: str
    rating: int = Field(default=600)
    games_played: int = Field(default=0)
    phone: str
    email: str


class Division(SQLModel, table=True):
    __tablename__ = "divisions"
    division_id: int | None = Field(primary_key=True, index=True)
    name: str
    day_of_week: int = Field(default=0)  # 0=Mon, 1=Tue, ..., 6=Sun
    active: bool = Field(default=True)


class Session(SQLModel, table=True):
    __tablename__ = "sessions"
    session_id: int | None = Field(primary_key=True, index=True)
    division_id: int = Field(foreign_key="divisions.division_id")
    name: str
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD
    match_time: str  # HH:MM
    active: bool = Field(default=True)


class DivisionPlayer(SQLModel, table=True):
    __tablename__ = "division_players"
    id: int | None = Field(primary_key=True)
    division_id: int = Field(foreign_key="divisions.division_id")
    player_id: int = Field(foreign_key="players.player_id")


class Match(SQLModel, table=True):
    __tablename__ = "matches"
    match_id: int | None = Field(primary_key=True)
    session_id: int | None = Field(default=None, foreign_key="sessions.session_id")
    player1_id: int = Field(foreign_key="players.player_id")
    player2_id: int = Field(foreign_key="players.player_id")
    player1_rating: int
    player2_rating: int
    scheduled_date: datetime
    completed: bool
    winner_id: int | None = Field(default=None, foreign_key="players.player_id")
    loser_id: int | None = Field(default=None, foreign_key="players.player_id")


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
