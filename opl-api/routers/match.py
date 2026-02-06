from datetime import datetime, date as date_type
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlmodel import SQLModel, Field, Session, select

from database import get_session
from routers.player import Player
from routers.game import Game


class Match(SQLModel, table=True):
    __tablename__ = "matches"
    match_id: Optional[int] = Field(primary_key=True)
    player1_id: int = Field(foreign_key="players.player_id")
    player2_id: int = Field(foreign_key="players.player_id")
    player1_rating: int
    player2_rating: int
    scheduled_date: datetime
    completed: bool


class GameInput(SQLModel):
    winner_id: int
    loser_id: int
    balls_remaining: int


class ScheduleInput(SQLModel):
    division: int
    start_date: datetime


router = APIRouter(
    prefix="/matches"
)


@router.get("/", response_model=list[Match])
def get_matches(
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    player_id: int | None = None,
    match_id: int | None = None,
    session: Session = Depends(get_session),
):
    if start_date is None and player_id is None and match_id is None:
        raise HTTPException(status_code=422, detail="At least one of start_date, player_id, or match_id is required")

    query = select(Match)
    if match_id is not None:
        query = query.where(Match.match_id == match_id)
    if player_id is not None:
        query = query.where(or_(Match.player1_id == player_id, Match.player2_id == player_id))
    if start_date is not None:
        query = query.where(func.date(Match.scheduled_date) >= start_date)
    if end_date is not None:
        query = query.where(func.date(Match.scheduled_date) <= end_date)

    return session.exec(query.order_by(Match.scheduled_date)).all()


@router.post("/schedule-round-robin/", response_model=list[Match])
def schedule_round_robin(
    body: ScheduleInput,
    session: Session = Depends(get_session),
):
    from utils import schedule_round_robin as generate_schedule

    players = session.exec(select(Player).where(Player.division_id == body.division)).all()
    if not players:
        raise HTTPException(status_code=404, detail=f"No players found in division {body.division}")

    matches = generate_schedule(players, body.start_date)
    session.add_all(matches)
    session.commit()
    for match in matches:
        session.refresh(match)
    return matches


@router.post("/", response_model=Match)
def create_match(match: Match, session: Session = Depends(get_session)):
    session.add(match)
    session.commit()
    session.refresh(match)
    return match


@router.put("/{match_id}/", response_model=Match)
def update_match(match_id: int, games: list[GameInput], session: Session = Depends(get_session)):
    db_match = session.get(Match, match_id)
    if not db_match:
        raise HTTPException(status_code=404, detail="Match not found")

    from utils import calculate_rating_change

    for game_input in games:
        winner = session.get(Player, game_input.winner_id)
        loser = session.get(Player, game_input.loser_id)

        winner_change, loser_change = calculate_rating_change(
            winner.games_played, loser.games_played, game_input.balls_remaining
        )

        session.add(Game(
            match_id=match_id,
            winner_id=game_input.winner_id,
            loser_id=game_input.loser_id,
            winner_rating=winner.rating,
            loser_rating=loser.rating,
            winner_rating_change=winner_change,
            loser_rating_change=loser_change,
            balls_remaining=game_input.balls_remaining,
            played_date=datetime.now(),
        ))

        winner.rating += winner_change
        loser.rating += loser_change
        winner.games_played += 1
        loser.games_played += 1

    db_match.completed = True
    session.add(db_match)

    # Update ratings in uncompleted matches for both players
    player1 = session.get(Player, db_match.player1_id)
    player2 = session.get(Player, db_match.player2_id)

    uncompleted_matches = session.exec(
        select(Match).where(
            Match.completed == False,
            or_(
                Match.player1_id == player1.player_id,
                Match.player2_id == player1.player_id,
                Match.player1_id == player2.player_id,
                Match.player2_id == player2.player_id,
            )
        )
    ).all()

    for m in uncompleted_matches:
        if m.player1_id == player1.player_id:
            m.player1_rating = player1.rating
        if m.player2_id == player1.player_id:
            m.player2_rating = player1.rating
        if m.player1_id == player2.player_id:
            m.player1_rating = player2.rating
        if m.player2_id == player2.player_id:
            m.player2_rating = player2.rating

    session.commit()
    session.refresh(db_match)
    return db_match
