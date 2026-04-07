"""fix_completed_match_weights

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-04-06 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, None] = 'c2d3e4f5a6b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def get_match_weight(rating1: int, rating2: int) -> tuple[int, int]:
    diff = abs(rating1 - rating2)

    if diff <= 50:
        high, low = 8, 8
    elif diff <= 100:
        high, low = 8, 7
    elif diff <= 150:
        high, low = 9, 7
    elif diff <= 200:
        high, low = 9, 6
    elif diff <= 250:
        high, low = 10, 6
    elif diff <= 300:
        high, low = 10, 5
    elif diff <= 350:
        high, low = 11, 5
    elif diff <= 400:
        high, low = 11, 4
    else:
        high, low = 12, 4

    if rating1 >= rating2:
        return (high, low)
    return (low, high)


def upgrade() -> None:
    conn = op.get_bind()
    matches = conn.execute(
        sa.text(
            "SELECT match_id, player1_rating, player2_rating "
            "FROM matches "
            "WHERE completed = 1 AND is_bye = 0 AND deleted = 0 "
            "AND player2_rating IS NOT NULL"
        )
    ).fetchall()

    for match_id, r1, r2 in matches:
        w1, w2 = get_match_weight(r1, r2)
        conn.execute(
            sa.text(
                "UPDATE matches SET player1_weight = :w1, player2_weight = :w2 "
                "WHERE match_id = :mid"
            ),
            {"w1": w1, "w2": w2, "mid": match_id},
        )


def downgrade() -> None:
    pass
