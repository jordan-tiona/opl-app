from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import SQLModel, Field, Session, select

from database import get_session


class Division(SQLModel, table=True):
    __tablename__ = "divisions"
    division_id: Optional[int] = Field(primary_key=True, index=True)
    name: str
    start_date: str  # YYYY-MM-DD
    end_date: str  # YYYY-MM-DD
    match_time: str  # HH:MM


router = APIRouter(
    prefix="/divisions"
)


@router.get("/", response_model=list[Division])
def get_divisions(session: Session = Depends(get_session)):
    return session.exec(select(Division)).all()


@router.get("/{division_id}/", response_model=Division)
def get_division(division_id: int, session: Session = Depends(get_session)):
    division = session.get(Division, division_id)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    return division


@router.post("/", response_model=Division)
def create_division(division: Division, session: Session = Depends(get_session)):
    session.add(division)
    session.commit()
    session.refresh(division)
    return division


@router.put("/{division_id}/", response_model=Division)
def update_division(division_id: int, division: Division, session: Session = Depends(get_session)):
    db_division = session.get(Division, division_id)
    if not db_division:
        raise HTTPException(status_code=404, detail="Division not found")
    for key, value in division.model_dump(exclude={"division_id"}).items():
        setattr(db_division, key, value)
    session.add(db_division)
    session.commit()
    session.refresh(db_division)
    return db_division
