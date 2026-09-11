"""confidence server default — expand phase of the two-step removal"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c41d7aa25e90"
down_revision: str | Sequence[str] | None = "ba1b688e106a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Expand: the column survives one deploy; the default satisfies NOT NULL."""
    op.alter_column("action_items", "confidence", server_default=sa.text("0"))


def downgrade() -> None:
    op.alter_column("action_items", "confidence", server_default=None)
