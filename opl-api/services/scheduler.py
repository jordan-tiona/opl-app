import asyncio
from datetime import date, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlmodel import Session, select

from services.database import engine
from services.email_service import send_match_reminder
from models import Match, Player
from models import Session as SessionModel

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


def start_scheduler() -> None:
    scheduler.add_job(send_match_reminders, 'cron', hour=8, minute=0, id='match_reminders')
    scheduler.start()


def stop_scheduler() -> None:
    scheduler.shutdown(wait=False)
