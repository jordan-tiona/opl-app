"""add race to matches

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-04-15

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('matches', sa.Column('race', sa.Integer(), nullable=False, server_default='3'))


def downgrade() -> None:
    op.drop_column('matches', 'race')
