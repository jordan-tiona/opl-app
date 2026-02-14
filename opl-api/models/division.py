from sqlmodel import Field, SQLModel


class Division(SQLModel, table=True):
    __tablename__ = "divisions"
    division_id: int | None = Field(primary_key=True, index=True)
    name: str
    day_of_week: int = Field(default=0)  # 0=Mon, 1=Tue, ..., 6=Sun
    active: bool = Field(default=True)


class DivisionPlayer(SQLModel, table=True):
    __tablename__ = "division_players"
    id: int | None = Field(primary_key=True)
    division_id: int = Field(foreign_key="divisions.division_id")
    player_id: int = Field(foreign_key="players.player_id")
