"""add dues to sessions

Revision ID: e5f6a7b8c9d0
Revises: cacca2123d18
Create Date: 2026-04-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'cacca2123d18'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('sessions', sa.Column('dues', sa.Integer(), nullable=False, server_default='10'))


def downgrade() -> None:
    op.drop_column('sessions', 'dues')
