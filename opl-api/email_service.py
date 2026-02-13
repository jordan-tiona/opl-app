import os

import markdown
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

conf = ConnectionConfig(
    MAIL_USERNAME=os.environ.get('CSOPL_SMTP_USER', 'noreply@csopl.com'),
    MAIL_PASSWORD=os.environ.get('CSOPL_SMTP_PASSWORD', ''),
    MAIL_FROM=os.environ.get('CSOPL_SMTP_USER', 'noreply@csopl.com'),
    MAIL_PORT=int(os.environ.get('CSOPL_SMTP_PORT', '587')),
    MAIL_SERVER=os.environ.get('CSOPL_SMTP_HOST', 'smtp.purelymail.com'),
    MAIL_FROM_NAME='CSOPL',
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

fm = FastMail(conf)


async def send_email(to: list[str], subject: str, body: str) -> None:
    """Send an HTML email. Body is markdown that gets rendered to HTML."""
    if not to:
        return
    html = markdown.markdown(body)
    message = MessageSchema(
        subject=subject,
        recipients=to,
        body=html,
        subtype=MessageType.html,
    )
    await fm.send_message(message)


async def send_match_reminder(
    player_email: str,
    player_name: str,
    opponent_name: str,
    opponent_rating: int,
    player_weight: int,
    match_time: str,
    scheduled_date: str,
) -> None:
    """Send a match reminder email to a single player."""
    body = f"""# Match Reminder

Hi {player_name},

You have a match scheduled for **today** ({scheduled_date}):

- **Opponent:** {opponent_name} (rated {opponent_rating})
- **Your race:** {player_weight}
- **Time:** {match_time}

Good luck!

— CSOPL
"""
    await send_email([player_email], 'Match Reminder - CSOPL', body)
