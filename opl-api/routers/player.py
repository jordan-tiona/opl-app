
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from services.auth import get_current_user, require_admin
from services.database import get_session
from models import Player, User

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


@router.get("/{player_id}/divisions/")
def get_player_divisions(player_id: int, active: bool | None = None, session: Session = Depends(get_session), _user: User = Depends(get_current_user)):
    from models import Division, DivisionPlayer

    player = session.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    query = select(Division).join(DivisionPlayer, Division.division_id == DivisionPlayer.division_id).where(DivisionPlayer.player_id == player_id)
    if active is not None:
        query = query.where(Division.active == active)
    return session.exec(query).all()


@router.put("/{player_id}/", response_model=Player)
def update_player(player_id: int, player: Player, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Allow admin or the player themselves
    if not current_user.is_admin and current_user.player_id != player_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this player")
    db_player = session.get(Player, player_id)
    if not db_player:
        raise HTTPException(status_code=404, detail="Player not found")
    # Non-admins can only update name and phone
    allowed_fields = {"first_name", "last_name", "phone"} if not current_user.is_admin else None
    for key, value in player.model_dump(exclude={"player_id"}).items():
        if allowed_fields and key not in allowed_fields:
            continue
        setattr(db_player, key, value)
    session.add(db_player)
    session.commit()
    session.refresh(db_player)
    return db_player
