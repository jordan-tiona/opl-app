"""add scoring and payments

Revision ID: d4e5f6a7b8c9
Revises: c2d3e4f5a6b7
Create Date: 2026-03-11

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c2d3e4f5a6b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('matches', sa.Column('score_status', sa.String(), nullable=True))

    op.create_table(
        'match_score_submissions',
        sa.Column('submission_id', sa.Integer(), primary_key=True),
        sa.Column('match_id', sa.Integer(), sa.ForeignKey('matches.match_id'), nullable=False, index=True),
        sa.Column('submitted_by_player_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=False),
        sa.Column('games_json', sa.String(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(), nullable=False),
        sa.Column('confirmed_by_player_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('disputed_by_player_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=True),
        sa.Column('disputed_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
    )

    op.create_table(
        'payments',
        sa.Column('payment_id', sa.Integer(), primary_key=True),
        sa.Column('match_id', sa.Integer(), sa.ForeignKey('matches.match_id'), nullable=False, index=True),
        sa.Column('player_id', sa.Integer(), sa.ForeignKey('players.player_id'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False, server_default='10.0'),
        sa.Column('payment_method', sa.String(), nullable=True),
        sa.Column('player_confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('admin_confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='unpaid'),
    )


def downgrade() -> None:
    op.drop_table('payments')
    op.drop_table('match_score_submissions')
    op.drop_column('matches', 'score_status')
