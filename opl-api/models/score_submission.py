from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class MatchScoreSubmission(SQLModel, table=True):
    __tablename__ = "match_score_submissions"
    submission_id: int | None = Field(primary_key=True)
    match_id: int = Field(foreign_key="matches.match_id", index=True)
    submitted_by_player_id: int = Field(foreign_key="players.player_id")
    # JSON-encoded list of {winner_id, loser_id, balls_remaining}
    games_json: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    needs_review_since: datetime | None = Field(default=None)
    # "pending" | "confirmed" | "needs_review" | "disputed"
    status: str = Field(default="pending")


class ScoreSubmissionResponse(SQLModel):
    my_submission: Optional[MatchScoreSubmission] = None
    # True if opponent has submitted, even before we reveal their games
    opponent_submitted: bool = False
    # Only populated once both players have submitted (needs_review / confirmed / disputed)
    opponent_submission: Optional[MatchScoreSubmission] = None
