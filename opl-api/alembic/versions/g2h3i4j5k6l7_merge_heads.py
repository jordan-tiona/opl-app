"""merge heads

Revision ID: g2h3i4j5k6l7
Revises: e1f2a3b4c5d6, f6a7b8c9d0e1
Create Date: 2026-04-15

"""
from typing import Sequence, Union

revision: str = 'g2h3i4j5k6l7'
down_revision: Union[str, tuple] = ('e1f2a3b4c5d6', 'f6a7b8c9d0e1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
