from sqlmodel import Field, SQLModel


class Player(SQLModel, table=True):
    __tablename__ = "players"
    player_id: int | None = Field(primary_key=True, index=True)
    first_name: str
    last_name: str
    rating: int = Field(default=600)
    games_played: int = Field(default=0)
    phone: str
    email: str
    email_notifications: bool = Field(default=False)
    match_reminders: bool = Field(default=False)
