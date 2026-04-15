import asyncio
from datetime import date, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlmodel import Session, select

from models import Match, MatchScoreSubmission, Message, MessageRecipient, Player
from models import Session as SessionModel
from services.database import engine
from services.email_service import send_match_reminder

scheduler = AsyncIOScheduler()


async def send_match_reminders() -> None:
    """Send reminder emails for matches scheduled today."""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = today_start + timedelta(days=1)

    with Session(engine) as session:
        matches = session.exec(
            select(Match).where(
                Match.scheduled_date >= today_start,
                Match.scheduled_date < today_end,
                Match.completed == False,  # noqa: E712
                Match.reminder_sent == False,  # noqa: E712
            )
        ).all()

        for match in matches:
            player1 = session.get(Player, match.player1_id)
            player2 = session.get(Player, match.player2_id)

            if not player1 or not player2:
                continue

            # Get match time from the session if available
            match_time = ''
            if match.session_id:
                sess = session.get(SessionModel, match.session_id)
                if sess:
                    match_time = sess.match_time

            scheduled_str = match.scheduled_date.strftime('%A, %B %d')

            tasks = []
            if player1.match_reminders:
                tasks.append(
                    send_match_reminder(
                        player_email=player1.email,
                        player_name=player1.first_name,
                        opponent_name=f'{player2.first_name} {player2.last_name}',
                        opponent_rating=match.player2_rating,
                        player_weight=match.player1_weight,
                        match_time=match_time,
                        scheduled_date=scheduled_str,
                    )
                )
            if player2.match_reminders:
                tasks.append(
                    send_match_reminder(
                        player_email=player2.email,
                        player_name=player2.first_name,
                        opponent_name=f'{player1.first_name} {player1.last_name}',
                        opponent_rating=match.player1_rating,
                        player_weight=match.player2_weight,
                        match_time=match_time,
                        scheduled_date=scheduled_str,
                    )
                )

            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)

            match.reminder_sent = True
            session.add(match)

        session.commit()


async def escalate_score_mismatches() -> None:
    """Escalate needs_review submissions older than 24 hours to disputed and notify admin."""
    cutoff = datetime.utcnow() - timedelta(hours=24)

    with Session(engine) as session:
        from models.user import User as UserModel
        from sqlalchemy import or_

        stale = session.exec(
            select(MatchScoreSubmission)
            .where(MatchScoreSubmission.status == "needs_review")
            .where(MatchScoreSubmission.needs_review_since <= cutoff)
        ).all()

        if not stale:
            return

        # Group by match so we update all submissions for a match together
        by_match: dict[int, list[MatchScoreSubmission]] = {}
        for sub in stale:
            by_match.setdefault(sub.match_id, []).append(sub)

        admin_user = session.exec(select(UserModel).where(UserModel.is_admin == True)).first()  # noqa: E712

        for match_id, subs in by_match.items():
            db_match = session.get(Match, match_id)
            if not db_match or db_match.completed:
                continue

            for sub in subs:
                sub.status = "disputed"
                session.add(sub)

            db_match.score_status = "disputed"
            session.add(db_match)

            if admin_user:
                player1 = session.get(Player, db_match.player1_id)
                player2 = session.get(Player, db_match.player2_id)
                p1_name = f"{player1.first_name} {player1.last_name}" if player1 else f"Player {db_match.player1_id}"
                p2_name = f"{player2.first_name} {player2.last_name}" if player2 else f"Player {db_match.player2_id}"

                msg = Message(
                    subject=f"Score Dispute Escalated – Match #{match_id}",
                    body=(
                        f"The score mismatch between {p1_name} and {p2_name} for Match #{match_id} "
                        f"was not resolved within 24 hours and has been escalated.\n\n"
                        f"Please review the submitted scores and resolve the dispute."
                    ),
                    sender_id=admin_user.user_id,
                    recipient_type="player",
                )
                session.add(msg)
                session.flush()

                recipients = [pid for pid in (db_match.player1_id, db_match.player2_id, admin_user.player_id) if pid]
                for pid in recipients:
                    session.add(MessageRecipient(message_id=msg.message_id, player_id=pid))

        session.commit()


def start_scheduler() -> None:
    scheduler.add_job(send_match_reminders, 'cron', hour=8, minute=0, id='match_reminders')
    scheduler.add_job(escalate_score_mismatches, 'interval', hours=1, id='escalate_score_mismatches')
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
