from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Field, Session, SQLModel, select

from auth import get_current_user, require_admin
from database import get_session
from routers.user import User


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


router = APIRouter(
    prefix="/games"
)


@router.get("/", response_model=list[Game])
def get_games(
    game_id: int | None = None,
    match_id: int | None = None,
    player_id: int | None = None,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
):
    if game_id is None and match_id is None and player_id is None:
        raise HTTPException(status_code=422, detail="At least one of game_id, match_id, or player_id is required")

    query = select(Game).order_by(Game.played_date)
    if game_id is not None:
        query = query.where(Game.game_id == game_id)
    if match_id is not None:
        query = query.where(Game.match_id == match_id)
    if player_id is not None:
        query = query.where((Game.winner_id == player_id) | (Game.loser_id == player_id))

    return session.exec(query).all()


@router.put("/{game_id}/", response_model=Game)
def update_game(game_id: int, game: Game, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    db_game = session.get(Game, game_id)
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    for key, value in game.model_dump(exclude={"game_id"}).items():
        setattr(db_game, key, value)
    session.add(db_game)
    session.commit()
    session.refresh(db_game)
    return db_game
