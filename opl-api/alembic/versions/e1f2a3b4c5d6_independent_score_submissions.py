"""independent score submissions

Revision ID: e1f2a3b4c5d6
Revises: d4e5f6a7b8c9
Branch Labels: None
Depends On: None

Move from a single shared submission per match to one submission per player per match.
Each player submits independently; the backend compares and auto-confirms or flags for
review.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add needs_review_since for the 24-hour escalation window
    op.add_column(
        'match_score_submissions',
        sa.Column('needs_review_since', sa.DateTime(), nullable=True),
    )

    # Enforce one submission per player per match
    op.create_unique_constraint(
        'uq_match_score_submissions_match_player',
        'match_score_submissions',
        ['match_id', 'submitted_by_player_id'],
    )

    # needs_review is a new score_status value — no DB constraint change needed
    # (score_status is a plain VARCHAR), but update the server_default comment
    # by ensuring existing 'pending' rows stay valid (nothing to do).


def downgrade() -> None:
    op.drop_constraint(
        'uq_match_score_submissions_match_player',
        'match_score_submissions',
        type_='unique',
    )
    op.drop_column('match_score_submissions', 'needs_review_since')
