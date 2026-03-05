"""baseline

Revision ID: 792569e4f76b
Revises:
Create Date: 2026-02-28 00:04:52.471304

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '792569e4f76b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'players' in existing_tables:
        return

    op.create_table(
        'players',
        sa.Column('player_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('first_name', sa.String(), nullable=False),
        sa.Column('last_name', sa.String(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False, server_default='600'),
        sa.Column('games_played', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('email_notifications', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('match_reminders', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.create_table(
        'divisions',
        sa.Column('division_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
    )
    op.create_table(
        'division_players',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('division_id', sa.Integer(), sa.ForeignKey('divisions.division_id'), nullable=False),
        sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=False),
    )
    op.create_table(
        'sessions',
        sa.Column('session_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('match_time', sa.String(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('start_date', sa.String(), nullable=False, server_default=''),
        sa.Column('end_date', sa.String(), nullable=False, server_default=''),
    )
    op.create_table(
        'matches',
        sa.Column('match_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('session_id', sa.Integer(), sa.ForeignKey('sessions.session_id'), nullable=True),
        sa.Column('division_id', sa.Integer(), sa.ForeignKey('divisions.division_id'), nullable=False),
        sa.Column('player1_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=False),
        sa.Column('player2_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=False),
        sa.Column('player1_rating', sa.Integer(), nullable=False),
        sa.Column('player2_rating', sa.Integer(), nullable=False),
        sa.Column('player1_weight', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('player2_weight', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('scheduled_date', sa.DateTime(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False),
        sa.Column('reminder_sent', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('winner_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=True),
        sa.Column('loser_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=True),
    )
    op.create_table(
        'games',
        sa.Column('game_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('match_id', sa.Integer(), sa.ForeignKey('matches.match_id'), nullable=False),
        sa.Column('winner_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=False),
        sa.Column('loser_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=False),
        sa.Column('winner_rating', sa.Integer(), nullable=False),
        sa.Column('loser_rating', sa.Integer(), nullable=False),
        sa.Column('winner_rating_change', sa.Integer(), nullable=False),
        sa.Column('loser_rating_change', sa.Integer(), nullable=False),
        sa.Column('balls_remaining', sa.Integer(), nullable=False),
        sa.Column('played_date', sa.DateTime(), nullable=False),
    )
    op.create_table(
        'users',
        sa.Column('user_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('google_id', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('picture', sa.String(), nullable=True),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=True),
    )
    op.create_table(
        'messages',
        sa.Column('message_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('body', sa.String(), nullable=False),
        sa.Column('sender_id', sa.Integer(), sa.ForeignKey('users.user_id'), nullable=False),
        sa.Column('recipient_type', sa.String(), nullable=False),
        sa.Column('recipient_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_table(
        'message_recipients',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('message_id', sa.Integer(), sa.ForeignKey('messages.message_id'), nullable=False),
        sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('message_recipients')
    op.drop_table('messages')
    op.drop_table('users')
    op.drop_table('games')
    op.drop_table('matches')
    op.drop_table('sessions')
    op.drop_table('division_players')
    op.drop_table('divisions')
    op.drop_table('players')
