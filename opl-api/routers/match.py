import json
import os
from datetime import date as date_type
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlmodel import Session, SQLModel, select

from models import Division, DivisionPlayer, Game, Match, MatchScoreSubmission, Message, MessageRecipient, Player, Session, User
from services.auth import get_current_user, require_admin
from services.database import get_session


class GameInput(SQLModel):
    winner_id: int
    loser_id: int
    balls_remaining: int


class ScheduleInput(SQLModel):
    session_id: int
    start_date: datetime
    double: bool = True


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

    query = select(Match).where(Match.deleted == False)  # noqa: E712
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
    query = select(Match).where(Match.session_id == session_id, Match.completed, Match.deleted == False)  # noqa: E712
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
        select(Match).where(Match.session_id == body.session_id, Match.completed == False)  # noqa: E712
    ).all()
    for m in old_matches:
        session.delete(m)

    # Schedule matches for each active, non-deleted division
    divisions = session.exec(
        select(Division).where(Division.active, Division.deleted == False)  # noqa: E712
    ).all()
    all_matches = []
    for division in divisions:
        players = session.exec(
            select(Player)
            .join(DivisionPlayer, Player.player_id == DivisionPlayer.player_id)
            .where(DivisionPlayer.division_id == division.division_id)
            .where(Player.deleted == False)  # noqa: E712
        ).all()
        if not players:
            continue
        is_weekly = division.day_of_week is None
        if is_weekly:
            # Snap to Monday of the start week
            div_start_date = body.start_date - timedelta(days=body.start_date.weekday())
        else:
            # Snap to the correct day of week within the start week
            monday = body.start_date - timedelta(days=body.start_date.weekday())
            div_start_date = monday + timedelta(days=division.day_of_week)
        matches = generate_schedule(players, div_start_date, body.session_id, division.division_id, double=body.double, is_weekly=is_weekly)
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
    if not db_match or db_match.deleted:
        raise HTTPException(status_code=404, detail="Match not found")

    from utils import calculate_rating_change, get_match_weight

    player1 = session.get(Player, db_match.player1_id)
    player2 = session.get(Player, db_match.player2_id)
    db_match.player1_rating = player1.rating if player1 else db_match.player1_rating
    db_match.player2_rating = player2.rating if player2 else db_match.player2_rating

    # Recalculate weights to match the actual ratings at play time
    if player1 and player2:
        w1, w2 = get_match_weight(player1.rating, player2.rating)
        db_match.player1_weight = w1
        db_match.player2_weight = w2

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
        db_match.loser_id = (
            db_match.player2_id if db_match.winner_id == db_match.player1_id else db_match.player1_id
        )

    db_match.completed = True
    session.add(db_match)

    # Update ratings in uncompleted, non-deleted matches for both players
    uncompleted_matches = session.exec(
        select(Match).where(
            not Match.completed,
            Match.deleted == False,  # noqa: E712
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


@router.put("/{match_id}/rescore/", response_model=Match)
def rescore_match(match_id: int, games: list[GameInput], session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    db_match = session.get(Match, match_id)
    if not db_match or db_match.deleted:
        raise HTTPException(status_code=404, detail="Match not found")
    if not db_match.completed:
        raise HTTPException(status_code=400, detail="Match is not completed; use the regular scoring endpoint")

    from utils import calculate_rating_change

    # Get existing games for this match ordered by game_id
    old_games = session.exec(select(Game).where(Game.match_id == match_id).order_by(Game.game_id)).all()
    if not old_games:
        raise HTTPException(status_code=400, detail="No games found for this match")

    # Use the earliest played_date so rescored games keep their original timestamp
    original_played_date = min(g.played_date for g in old_games)

    # Collect the two match players
    match_player_ids = {db_match.player1_id, db_match.player2_id}

    # Find all subsequent games (any match) involving either player, ordered chronologically
    subsequent_games = session.exec(
        select(Game)
        .where(Game.match_id != match_id)
        .where(Game.played_date > original_played_date)
        .where(or_(Game.winner_id.in_(match_player_ids), Game.loser_id.in_(match_player_ids)))
        .order_by(Game.played_date, Game.game_id)
    ).all()

    # Reverse subsequent games (reverse order) to unwind their rating/games_played changes
    for g in reversed(subsequent_games):
        winner = session.get(Player, g.winner_id)
        loser = session.get(Player, g.loser_id)
        winner.rating -= g.winner_rating_change
        loser.rating -= g.loser_rating_change
        winner.games_played -= 1
        loser.games_played -= 1

    # Reverse this match's games (reverse order)
    for g in reversed(old_games):
        winner = session.get(Player, g.winner_id)
        loser = session.get(Player, g.loser_id)
        winner.rating -= g.winner_rating_change
        loser.rating -= g.loser_rating_change
        winner.games_played -= 1
        loser.games_played -= 1
        session.delete(g)

    # Apply new games
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
            played_date=original_played_date,
        ))

        winner.rating += winner_change
        loser.rating += loser_change
        winner.games_played += 1
        loser.games_played += 1

    # Update match winner/loser
    game_wins: dict[int, int] = {}
    for game_input in games:
        game_wins[game_input.winner_id] = game_wins.get(game_input.winner_id, 0) + 1
    if game_wins:
        db_match.winner_id = max(game_wins, key=game_wins.get)
        db_match.loser_id = (
            db_match.player2_id if db_match.winner_id == db_match.player1_id else db_match.player1_id
        )

    session.add(db_match)

    # Re-apply subsequent games with recalculated rating changes
    for g in subsequent_games:
        winner = session.get(Player, g.winner_id)
        loser = session.get(Player, g.loser_id)

        winner_change, loser_change = calculate_rating_change(
            winner.games_played, loser.games_played, g.balls_remaining
        )

        g.winner_rating = winner.rating
        g.loser_rating = loser.rating
        g.winner_rating_change = winner_change
        g.loser_rating_change = loser_change

        winner.rating += winner_change
        loser.rating += loser_change
        winner.games_played += 1
        loser.games_played += 1

        session.add(g)

    session.commit()
    session.refresh(db_match)
    return db_match


@router.patch("/{match_id}/incompleted/", response_model=Match)
def mark_incompleted(match_id: int, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    db_match = session.get(Match, match_id)
    if not db_match or db_match.deleted:
        raise HTTPException(status_code=404, detail="Match not found")
    if db_match.completed:
        raise HTTPException(status_code=400, detail="Cannot mark a completed match as incompleted")
    db_match.incompleted = True
    session.add(db_match)
    session.commit()
    session.refresh(db_match)
    return db_match


def _match_week_bounds(scheduled_date: datetime) -> tuple[datetime, datetime]:
    """Return the Monday 00:00 and Sunday 23:59:59 of the week containing scheduled_date."""
    monday = scheduled_date - timedelta(days=scheduled_date.weekday())
    week_start = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)
    return week_start, week_end


@router.get("/{match_id}/score/", response_model=MatchScoreSubmission | None)
def get_match_score(
    match_id: int,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
):
    return session.exec(
        select(MatchScoreSubmission).where(MatchScoreSubmission.match_id == match_id)
    ).first()


@router.post("/{match_id}/score/", response_model=MatchScoreSubmission)
def submit_match_score(
    match_id: int,
    games: list[GameInput],
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    db_match = session.get(Match, match_id)
    if not db_match or db_match.deleted:
        raise HTTPException(status_code=404, detail="Match not found")
    if db_match.completed:
        raise HTTPException(status_code=400, detail="Match is already completed")
    if db_match.is_bye:
        raise HTTPException(status_code=400, detail="Cannot score a bye match")
    if not user.player_id:
        raise HTTPException(status_code=403, detail="No player linked to this account")
    if user.player_id not in (db_match.player1_id, db_match.player2_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this match")

    # Enforce scoring window: Mon–Sun of the match week
    week_start, week_end = _match_week_bounds(db_match.scheduled_date)
    now = datetime.utcnow()
    if not (week_start <= now <= week_end):
        raise HTTPException(
            status_code=400,
            detail=f"Match scoring is only available during the week of the match "
                   f"({week_start.date()} – {week_end.date()})",
        )

    # Validate that submitted player IDs match the match participants
    valid_player_ids = {db_match.player1_id, db_match.player2_id}
    for g in games:
        if g.winner_id not in valid_player_ids or g.loser_id not in valid_player_ids:
            raise HTTPException(status_code=400, detail="Game player IDs must match match participants")
        if g.winner_id == g.loser_id:
            raise HTTPException(status_code=400, detail="Winner and loser cannot be the same player")

    # Remove any prior submission (allow resubmission while still pending)
    existing = session.exec(
        select(MatchScoreSubmission).where(MatchScoreSubmission.match_id == match_id)
    ).first()
    if existing:
        if existing.status == "confirmed":
            raise HTTPException(status_code=400, detail="Score is already confirmed")
        session.delete(existing)
        session.flush()

    demo_mode = os.environ.get("DEMO_MODE") == "true" or os.environ.get("AUTO_CONFIRM_SCORES") == "true"
    submission = MatchScoreSubmission(
        match_id=match_id,
        submitted_by_player_id=user.player_id,
        games_json=json.dumps([g.model_dump() for g in games]),
        status="confirmed" if demo_mode else "pending",
        confirmed_by_player_id=user.player_id if demo_mode else None,
        confirmed_at=datetime.utcnow() if demo_mode else None,
    )
    session.add(submission)
    db_match.score_status = "confirmed" if demo_mode else "pending"
    session.add(db_match)
    session.commit()
    session.refresh(submission)
    return submission


@router.post("/{match_id}/score/confirm/", response_model=MatchScoreSubmission)
def confirm_match_score(
    match_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    db_match = session.get(Match, match_id)
    if not db_match or db_match.deleted:
        raise HTTPException(status_code=404, detail="Match not found")
    if not user.player_id:
        raise HTTPException(status_code=403, detail="No player linked to this account")
    if user.player_id not in (db_match.player1_id, db_match.player2_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this match")

    submission = session.exec(
        select(MatchScoreSubmission).where(MatchScoreSubmission.match_id == match_id)
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="No score submission found for this match")
    if submission.status != "pending":
        raise HTTPException(status_code=400, detail=f"Score is already {submission.status}")
    if submission.submitted_by_player_id == user.player_id:
        raise HTTPException(status_code=400, detail="You cannot confirm your own score submission")

    submission.confirmed_by_player_id = user.player_id
    submission.confirmed_at = datetime.utcnow()
    submission.status = "confirmed"
    db_match.score_status = "confirmed"
    session.add(submission)
    session.add(db_match)
    session.flush()

    opl_session = session.get(Session, db_match.session_id) if db_match.session_id else None
    if opl_session and opl_session.dues == 0:
        from routers.payment import _complete_match_from_submission
        _complete_match_from_submission(db_match.match_id, db_match, session)

    session.commit()
    session.refresh(submission)
    return submission


@router.post("/{match_id}/score/dispute/", response_model=MatchScoreSubmission)
def dispute_match_score(
    match_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    db_match = session.get(Match, match_id)
    if not db_match or db_match.deleted:
        raise HTTPException(status_code=404, detail="Match not found")
    if not user.player_id:
        raise HTTPException(status_code=403, detail="No player linked to this account")
    if user.player_id not in (db_match.player1_id, db_match.player2_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this match")

    submission = session.exec(
        select(MatchScoreSubmission).where(MatchScoreSubmission.match_id == match_id)
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="No score submission found for this match")
    if submission.status != "pending":
        raise HTTPException(status_code=400, detail=f"Score is already {submission.status}")
    if submission.submitted_by_player_id == user.player_id:
        raise HTTPException(status_code=400, detail="You cannot dispute your own score submission")

    submission.disputed_by_player_id = user.player_id
    submission.disputed_at = datetime.utcnow()
    submission.status = "disputed"
    db_match.score_status = "disputed"
    session.add(submission)
    session.add(db_match)

    # Auto-create a system message to notify admin and both players
    player1 = session.get(Player, db_match.player1_id)
    player2 = session.get(Player, db_match.player2_id)
    p1_name = f"{player1.first_name} {player1.last_name}" if player1 else f"Player {db_match.player1_id}"
    p2_name = f"{player2.first_name} {player2.last_name}" if player2 else f"Player {db_match.player2_id}"

    # Find an admin user to act as sender
    from models.user import User as UserModel
    admin_user = session.exec(select(UserModel).where(UserModel.is_admin == True)).first()  # noqa: E712
    if admin_user:
        msg = Message(
            subject=f"Score Dispute – Match #{match_id}",
            body=(
                f"A score dispute has been submitted for the match between {p1_name} and {p2_name} "
                f"(Match #{match_id}).\n\n"
                f"The submitted score was disputed by {p1_name if user.player_id == db_match.player1_id else p2_name}. "
                f"Please review and resolve the dispute."
            ),
            sender_id=admin_user.user_id,
            recipient_type="player",
        )
        session.add(msg)
        session.flush()

        for pid in (db_match.player1_id, db_match.player2_id):
            session.add(MessageRecipient(message_id=msg.message_id, player_id=pid))

    session.commit()
    session.refresh(submission)
    return submission


@router.delete("/{match_id}/")
def delete_match(match_id: int, session: Session = Depends(get_session), _admin: User = Depends(require_admin)):
    db_match = session.get(Match, match_id)
    if not db_match or db_match.deleted:
        raise HTTPException(status_code=404, detail="Match not found")
    db_match.deleted = True
    session.add(db_match)
    session.commit()
    return {"ok": True}
