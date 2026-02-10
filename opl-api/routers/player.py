
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Field, Session, SQLModel, select

from auth import get_current_user, require_admin
from database import get_session
from routers.user import User


class Player(SQLModel, table=True):
    __tablename__ = "players"
    player_id: int | None = Field(primary_key=True, index=True)
    division_id: int | None
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
def get_players(session: Session = Depends(get_session), _user: User = Depends(get_current_user)):
    return session.exec(select(Player)).all()


@router.get("/{player_id}/", response_model=Player)
def get_player(player_id: int, session: Session = Depends(get_session), _user: User = Depends(get_current_user)):
    player = session.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.post("/", response_model=Player)
def create_player(player: Player, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    session.add(player)
    session.commit()
    session.refresh(player)

    # Create a User for this player's email
    existing_user = session.exec(select(User).where(User.email == player.email)).first()
    if not existing_user:
        session.add(User(email=player.email, player_id=player.player_id))
        session.commit()

    return player


@router.put("/{player_id}/", response_model=Player)
def update_player(player_id: int, player: Player, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    db_player = session.get(Player, player_id)
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    for key, value in player.model_dump(exclude={"player_id"}).items():
        setattr(db_player, key, value)
    session.add(db_player)
    session.commit()
    session.refresh(db_player)
    return db_player
