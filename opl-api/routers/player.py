from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import SQLModel, Field, Session, select

from database import get_session


class Player(SQLModel, table=True):
    __tablename__ = "players"
    player_id: Optional[int] = Field(primary_key=True, index=True)
    division_id: Optional[int]
    first_name: str
    last_name: str
    rating: int = Field(default=600)
    games_played: int = Field(default=0)
    phone: str
    email: str


router = APIRouter(
    prefix="/players"
)


@router.get("/", response_model=list[Player])
def get_players(session: Session = Depends(get_session)):
    return session.exec(select(Player)).all()


@router.get("/{player_id}/", response_model=Player)
def get_player(player_id: int, session: Session = Depends(get_session)):
    player = session.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post("/", response_model=Player)
def create_player(player: Player, session: Session = Depends(get_session)):
    session.add(player)
    session.commit()
    session.refresh(player)
    return player


@router.put("/{player_id}/", response_model=Player)
def update_player(player_id: int, player: Player, session: Session = Depends(get_session)):
    db_player = session.get(Player, player_id)
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    for key, value in player.model_dump(exclude={"player_id"}).items():
        setattr(db_player, key, value)
    session.add(db_player)
    session.commit()
    session.refresh(db_player)
    return db_player
