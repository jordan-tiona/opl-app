from datetime import date as date_type
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlmodel import Session, SQLModel, select

from auth import get_current_user, require_admin
from database import get_session
from models import Division, DivisionPlayer, Game, Match, Player, User


class GameInput(SQLModel):
    winner_id: int
    loser_id: int
    balls_remaining: int


class ScheduleInput(SQLModel):
    session_id: int
    start_date: datetime


class PlayerScore(SQLModel):
    player_id: int
    score: int


router = APIRouter(
    prefix="/matches"
)


@router.get("/", response_model=list[Match])
def get_matches(
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    player_id: int | None = None,
    match_id: int | None = None,
    session_id: int | None = None,
    division_id: int | None = None,
    completed: bool | None = None,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
):
    if start_date is None and player_id is None and match_id is None and session_id is None and division_id is None:
        raise HTTPException(status_code=422, detail="At least one of start_date, player_id, match_id, session_id, or division_id is required")

    query = select(Match)
    if match_id is not None:
        query = query.where(Match.match_id == match_id)
    if session_id is not None:
        query = query.where(Match.session_id == session_id)
    if division_id is not None:
        query = query.where(Match.division_id == division_id)
    if player_id is not None:
        query = query.where(or_(Match.player1_id == player_id, Match.player2_id == player_id))
    if start_date is not None:
        query = query.where(func.date(Match.scheduled_date) >= start_date)
    if end_date is not None:
        query = query.where(func.date(Match.scheduled_date) <= end_date)
    if completed is not None:
        query = query.where(Match.completed == completed)

    return session.exec(query.order_by(Match.scheduled_date)).all()


@router.get("/scores/", response_model=list[PlayerScore])
def get_scores(
    session_id: int,
    division_id: int | None = None,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
):
    query = select(Match).where(Match.session_id == session_id, Match.completed)
    if division_id is not None:
        query = query.where(Match.division_id == division_id)
    matches = session.exec(query).all()
    match_ids = [m.match_id for m in matches]
    if not match_ids:
        return []

    games = session.exec(select(Game).where(Game.match_id.in_(match_ids))).all()

    # Group game wins by match and player
    match_player_wins: dict[int, dict[int, int]] = {}
    for game in games:
        wins = match_player_wins.setdefault(game.match_id, {})
        wins[game.winner_id] = wins.get(game.winner_id, 0) + 1

    # Calculate scores per match (race-agnostic):
    # - Shutout (loser won 0 games): winner gets 3pts
    # - Non-shutout: winner gets 2pts
    # - Loser reached the hill (1 game from winning): loser gets 1pt
    player_scores: dict[int, int] = {}
    for wins_by_player in match_player_wins.values():
        sorted_players = sorted(wins_by_player.items(), key=lambda x: x[1], reverse=True)
        winner_id, winner_wins = sorted_players[0]
        loser_wins = sorted_players[1][1] if len(sorted_players) > 1 else 0

        if loser_wins == 0:
            player_scores[winner_id] = player_scores.get(winner_id, 0) + 3
        else:
            player_scores[winner_id] = player_scores.get(winner_id, 0) + 2
            if loser_wins == winner_wins - 1:
                loser_id = sorted_players[1][0]
                player_scores[loser_id] = player_scores.get(loser_id, 0) + 1

    return [PlayerScore(player_id=pid, score=s) for pid, s in player_scores.items()]


@router.post("/schedule-round-robin/", response_model=list[Match])
def schedule_round_robin(
    body: ScheduleInput,
    session: Session = Depends(get_session),
    _admin: User = Depends(require_admin),
):
    from models import Session as SessionModel
    from utils import schedule_round_robin as generate_schedule

    opl_session = session.get(SessionModel, body.session_id)
    if not opl_session:
        raise HTTPException(status_code=404, detail=f"Session {body.session_id} not found")

    # Delete uncompleted matches for this session
    old_matches = session.exec(
        select(Match).where(Match.session_id == body.session_id, not Match.completed)
    ).all()
    for m in old_matches:
        session.delete(m)

    # Schedule matches for each division
    divisions = session.exec(select(Division).where(Division.active)).all()
    all_matches = []
    for division in divisions:
        players = session.exec(
            select(Player).join(DivisionPlayer, Player.player_id == DivisionPlayer.player_id)
            .where(DivisionPlayer.division_id == division.division_id)
        ).all()
        if not players:
            continue
        matches = generate_schedule(players, body.start_date, body.session_id, division.division_id)
        all_matches.extend(matches)

    if not all_matches:
        raise HTTPException(status_code=404, detail="No players found in any division")

    session.add_all(all_matches)
    session.commit()
    for match in all_matches:
        session.refresh(match)
    return all_matches


@router.post("/", response_model=Match)
def create_match(match: Match, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    session.add(match)
    session.commit()
    session.refresh(match)
    return match


@router.put("/{match_id}/", response_model=Match)
def update_match(match_id: int, games: list[GameInput], session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
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

    # Determine match winner by counting game wins
    game_wins: dict[int, int] = {}
    for game_input in games:
        game_wins[game_input.winner_id] = game_wins.get(game_input.winner_id, 0) + 1
    if game_wins:
        db_match.winner_id = max(game_wins, key=game_wins.get)
        db_match.loser_id = min(game_wins, key=game_wins.get)

    db_match.completed = True
    session.add(db_match)

    # Update ratings in uncompleted matches for both players
    player1 = session.get(Player, db_match.player1_id)
    player2 = session.get(Player, db_match.player2_id)

    uncompleted_matches = session.exec(
        select(Match).where(
            not Match.completed,
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
