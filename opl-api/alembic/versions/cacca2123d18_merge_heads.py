"""merge heads

Revision ID: cacca2123d18
Revises: d3e4f5a6b7c8, d4e5f6a7b8c9
Create Date: 2026-04-10 11:58:10.947500

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cacca2123d18'
down_revision: Union[str, Sequence[str], None] = ('d3e4f5a6b7c8', 'd4e5f6a7b8c9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
