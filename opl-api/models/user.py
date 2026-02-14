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
