
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Field, Session, SQLModel, select

from auth import get_current_user, require_admin
from database import get_session
from routers.user import User


class Division(SQLModel, table=True):
    __tablename__ = "divisions"
    division_id: int | None = Field(primary_key=True, index=True)
    name: str
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD
    match_time: str  # HH:MM
    active: bool = Field(default=True)


class DivisionPlayer(SQLModel, table=True):
    __tablename__ = "division_players"
    id: int | None = Field(primary_key=True)
    division_id: int = Field(foreign_key="divisions.division_id")
    player_id: int = Field(foreign_key="players.player_id")


class CopyDivisionInput(SQLModel):
    name: str
    start_date: str
    end_date: str
    match_time: str


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
    from routers.player import Player

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
    from routers.player import Player

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


@router.post("/{division_id}/copy/", response_model=Division)
def copy_division(division_id: int, body: CopyDivisionInput, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    source = session.get(Division, division_id)
    if not source:
        raise HTTPException(status_code=404, detail="Division not found")

    # Create new division
    new_division = Division(
        name=body.name,
        start_date=body.start_date,
        end_date=body.end_date,
        match_time=body.match_time,
        active=True,
    )
    session.add(new_division)
    session.flush()

    # Copy players from source to new division
    source_players = session.exec(
        select(DivisionPlayer).where(DivisionPlayer.division_id == division_id)
    ).all()
    for sp in source_players:
        session.add(DivisionPlayer(division_id=new_division.division_id, player_id=sp.player_id))

    # Deactivate source division
    source.active = False

    session.commit()
    session.refresh(new_division)
    return new_division
