from datetime import datetime

from sqlmodel import Field, SQLModel


class MatchScoreSubmission(SQLModel, table=True):
    __tablename__ = "match_score_submissions"
    submission_id: int | None = Field(primary_key=True)
    match_id: int = Field(foreign_key="matches.match_id", index=True)
    submitted_by_player_id: int = Field(foreign_key="players.player_id")
    # JSON-encoded list of {winner_id, loser_id, balls_remaining}
    games_json: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    # Set by the opposing player
    confirmed_by_player_id: int | None = Field(default=None, foreign_key="players.player_id")
    confirmed_at: datetime | None = Field(default=None)
    disputed_by_player_id: int | None = Field(default=None, foreign_key="players.player_id")
    disputed_at: datetime | None = Field(default=None)
    # "pending" | "confirmed" | "disputed"
    status: str = Field(default="pending")
