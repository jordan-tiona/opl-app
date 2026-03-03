"""add_is_bye_and_nullable_player2_to_matches

Revision ID: a3c9f2d1e840
Revises: febd118bfcad
Create Date: 2026-03-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3c9f2d1e840'
down_revision: Union[str, Sequence[str], None] = 'febd118bfcad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('matches', sa.Column('is_bye', sa.Boolean(), nullable=False, server_default='0'))
    with op.batch_alter_table('matches') as batch_op:
        batch_op.alter_column('player2_id', nullable=True)
        batch_op.alter_column('player2_rating', nullable=True)
        batch_op.alter_column('player2_weight', nullable=True)


def downgrade() -> None:
    with op.batch_alter_table('matches') as batch_op:
        batch_op.alter_column('player2_weight', nullable=False)
        batch_op.alter_column('player2_rating', nullable=False)
        batch_op.alter_column('player2_id', nullable=False)
    op.drop_column('matches', 'is_bye')
