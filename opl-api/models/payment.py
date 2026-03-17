from datetime import datetime

from sqlmodel import Field, SQLModel


class Payment(SQLModel, table=True):
    __tablename__ = "payments"
    payment_id: int | None = Field(primary_key=True)
    match_id: int = Field(foreign_key="matches.match_id", index=True)
    player_id: int = Field(foreign_key="players.player_id")
    amount: float = Field(default=10.0)
    # "cashapp" | "venmo" | "zelle"
    payment_method: str | None = Field(default=None)
    # Player self-reports payment
    player_confirmed_at: datetime | None = Field(default=None)
    # Admin verifies payment
    admin_confirmed_at: datetime | None = Field(default=None)
    # "unpaid" | "player_pending" | "confirmed"
    status: str = Field(default="unpaid")
