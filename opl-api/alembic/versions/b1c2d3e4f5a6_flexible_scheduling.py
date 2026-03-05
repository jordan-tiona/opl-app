"""flexible_scheduling

Revision ID: b1c2d3e4f5a6
Revises: a3c9f2d1e840
Create Date: 2026-03-04 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = 'a3c9f2d1e840'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make divisions.day_of_week nullable (batch for SQLite compatibility)
    with op.batch_alter_table('divisions') as batch_op:
        batch_op.alter_column('day_of_week', existing_type=sa.Integer(), nullable=True)

    # Make sessions.match_time nullable (batch for SQLite compatibility)
    with op.batch_alter_table('sessions') as batch_op:
        batch_op.alter_column('match_time', existing_type=sa.String(), nullable=True)

    # Add is_weekly boolean to matches (default False preserves existing behavior)
    op.add_column('matches', sa.Column('is_weekly', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('matches', 'is_weekly')

    # Set nulls to defaults before making non-nullable
    op.execute("UPDATE sessions SET match_time = '' WHERE match_time IS NULL")
    with op.batch_alter_table('sessions') as batch_op:
        batch_op.alter_column('match_time', existing_type=sa.String(), nullable=False)

    op.execute("UPDATE divisions SET day_of_week = 0 WHERE day_of_week IS NULL")
    with op.batch_alter_table('divisions') as batch_op:
        batch_op.alter_column('day_of_week', existing_type=sa.Integer(), nullable=False)
