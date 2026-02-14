
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from services.auth import get_current_user, require_admin
from services.database import get_session
from models import Division, DivisionPlayer, Player, User


router = APIRouter(
    prefix="/divisions"
)


@router.get("/", response_model=list[Division])
def get_divisions(active: bool | None = None, session: Session = Depends(get_session), _user: User = Depends(get_current_user)):
    query = select(Division)
    if active is not None:
        query = query.where(Division.active == active)
    return session.exec(query).all()


@router.get("/{division_id}/", response_model=Division)
def get_division(division_id: int, session: Session = Depends(get_session), _user: User = Depends(get_current_user)):
    division = session.get(Division, division_id)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    return division


@router.post("/", response_model=Division)
def create_division(division: Division, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    session.add(division)
    session.commit()
    session.refresh(division)
    return division


@router.put("/{division_id}/", response_model=Division)
def update_division(division_id: int, division: Division, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    db_division = session.get(Division, division_id)
    if not db_division:
        raise HTTPException(status_code=404, detail="Division not found")
    for key, value in division.model_dump(exclude={"division_id"}).items():
        setattr(db_division, key, value)
    session.add(db_division)
    session.commit()
    session.refresh(db_division)
    return db_division


@router.get("/{division_id}/players/", response_model=list)
def get_division_players(division_id: int, session: Session = Depends(get_session), _user: User = Depends(get_current_user)):

    division = session.get(Division, division_id)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")

    players = session.exec(
        select(Player).join(DivisionPlayer, Player.player_id == DivisionPlayer.player_id)
        .where(DivisionPlayer.division_id == division_id)
    ).all()
    return players


@router.post("/{division_id}/players/{player_id}/", response_model=DivisionPlayer)
def add_player_to_division(division_id: int, player_id: int, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):

    division = session.get(Division, division_id)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")

    player = session.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    existing = session.exec(
        select(DivisionPlayer).where(
            DivisionPlayer.division_id == division_id,
            DivisionPlayer.player_id == player_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Player already in this division")

    dp = DivisionPlayer(division_id=division_id, player_id=player_id)
    session.add(dp)
    session.commit()
    session.refresh(dp)
    return dp


@router.delete("/{division_id}/players/{player_id}/")
def remove_player_from_division(division_id: int, player_id: int, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    dp = session.exec(
        select(DivisionPlayer).where(
            DivisionPlayer.division_id == division_id,
            DivisionPlayer.player_id == player_id,
        )
    ).first()
    if not dp:
        raise HTTPException(status_code=404, detail="Player not in this division")

    session.delete(dp)
    session.commit()
    return {"ok": True}
