from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from models import Game, Match, MatchScoreSubmission, Payment, Player, Session, User
from services.auth import get_current_user, require_admin
from services.database import get_session

router = APIRouter(prefix="/payments")


class PaymentReport(BaseModel):
    payment_method: str  # "cashapp" | "venmo" | "zelle"


@router.get("/", response_model=list[Payment])
def get_player_payments(
    player_id: int,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
):
    """Get all payment records for a player across all matches."""
    return session.exec(select(Payment).where(Payment.player_id == player_id)).all()


@router.get("/{match_id}/", response_model=list[Payment])
def get_match_payments(
    match_id: int,
    session: Session = Depends(get_session),
    _user: User = Depends(get_current_user),
):
    return session.exec(select(Payment).where(Payment.match_id == match_id)).all()


@router.post("/{match_id}/", response_model=Payment)
def report_payment(
    match_id: int,
    body: PaymentReport,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Player self-reports that they have submitted payment."""
    db_match = session.get(Match, match_id)
    if not db_match or db_match.deleted:
        raise HTTPException(status_code=404, detail="Match not found")
    if db_match.completed:
        raise HTTPException(status_code=400, detail="Match is already completed")
    if db_match.is_bye:
        raise HTTPException(status_code=400, detail="Bye matches do not require payment")
    opl_session = session.get(Session, db_match.session_id) if db_match.session_id else None
    if opl_session and opl_session.dues == 0:
        raise HTTPException(status_code=400, detail="This session does not require dues")
    if not user.player_id:
        raise HTTPException(status_code=403, detail="No player linked to this account")
    if user.player_id not in (db_match.player1_id, db_match.player2_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this match")

    existing = session.exec(
        select(Payment).where(
            Payment.match_id == match_id,
            Payment.player_id == user.player_id,
        )
    ).first()

    if existing:
        if existing.status == "confirmed":
            raise HTTPException(status_code=400, detail="Your payment has already been confirmed")
        existing.payment_method = body.payment_method
        existing.player_confirmed_at = datetime.utcnow()
        existing.status = "player_pending"
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    payment = Payment(
        match_id=match_id,
        player_id=user.player_id,
        payment_method=body.payment_method,
        player_confirmed_at=datetime.utcnow(),
        status="player_pending",
    )
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


@router.patch("/{match_id}/{player_id}/confirm/", response_model=Payment)
def confirm_payment(
    match_id: int,
    player_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
):
    """Admin confirms that a player's payment has been received."""
    payment = session.exec(
        select(Payment).where(
            Payment.match_id == match_id,
            Payment.player_id == player_id,
        )
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="No payment record found for this player")
    if payment.status == "confirmed":
        raise HTTPException(status_code=400, detail="Payment is already confirmed")

    payment.admin_confirmed_at = datetime.utcnow()
    payment.status = "confirmed"
    session.add(payment)
    session.flush()

    # Check if both players have confirmed payments and score is confirmed → auto-complete
    db_match = session.get(Match, match_id)
    if db_match and not db_match.completed and db_match.score_status == "confirmed":
        payments = session.exec(select(Payment).where(Payment.match_id == match_id)).all()
        confirmed_player_ids = {p.player_id for p in payments if p.status == "confirmed"}
        both_paid = (
            db_match.player1_id in confirmed_player_ids
            and db_match.player2_id in confirmed_player_ids
        )
        if both_paid:
            _complete_match_from_submission(match_id, db_match, session)

    session.commit()
    session.refresh(payment)
    return payment


def _complete_match_from_submission(match_id: int, db_match: Match, session: Session) -> None:
    """Complete a match using the confirmed score submission."""
    from utils import calculate_rating_change

    submission = session.exec(
        select(MatchScoreSubmission).where(MatchScoreSubmission.match_id == match_id)
    ).first()
    if not submission or submission.status != "confirmed":
        return

    import json
    games_data = json.loads(submission.games_json)

    for game_data in games_data:
        winner = session.get(Player, game_data["winner_id"])
        loser = session.get(Player, game_data["loser_id"])

        winner_change, loser_change = calculate_rating_change(
            winner.games_played, loser.games_played, game_data["balls_remaining"]
        )

        session.add(Game(
            match_id=match_id,
            winner_id=game_data["winner_id"],
            loser_id=game_data["loser_id"],
            winner_rating=winner.rating,
            loser_rating=loser.rating,
            winner_rating_change=winner_change,
            loser_rating_change=loser_change,
            balls_remaining=game_data["balls_remaining"],
            played_date=datetime.utcnow(),
        ))

        winner.rating += winner_change
        loser.rating += loser_change
        winner.games_played += 1
        loser.games_played += 1

    game_wins: dict[int, int] = {}
    for g in games_data:
        game_wins[g["winner_id"]] = game_wins.get(g["winner_id"], 0) + 1
    if game_wins:
        db_match.winner_id = max(game_wins, key=game_wins.get)
        db_match.loser_id = (
            db_match.player2_id if db_match.winner_id == db_match.player1_id else db_match.player1_id
        )

    db_match.completed = True
    session.add(db_match)

    # Update stored ratings on uncompleted matches for both players
    from sqlalchemy import or_
    from sqlmodel import select as sm_select

    player1 = session.get(Player, db_match.player1_id)
    player2 = session.get(Player, db_match.player2_id)

    uncompleted = session.exec(
        sm_select(Match).where(
            Match.completed == False,  # noqa: E712
            Match.deleted == False,  # noqa: E712
            or_(
                Match.player1_id == player1.player_id,
                Match.player2_id == player1.player_id,
                Match.player1_id == player2.player_id,
                Match.player2_id == player2.player_id,
            ),
        )
    ).all()

    for m in uncompleted:
        if m.player1_id == player1.player_id:
            m.player1_rating = player1.rating
        if m.player2_id == player1.player_id:
            m.player2_rating = player1.rating
        if m.player1_id == player2.player_id:
            m.player1_rating = player2.rating
        if m.player2_id == player2.player_id:
            m.player2_rating = player2.rating
