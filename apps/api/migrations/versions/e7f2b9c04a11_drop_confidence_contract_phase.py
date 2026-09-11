"""drop action_items.confidence — contract phase of the two-step removal"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7f2b9c04a11"
down_revision: str | Sequence[str] | None = "c41d7aa25e90"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Contract: expand already deployed, nothing references the column — safe drop."""
    op.drop_column("action_items", "confidence")


def downgrade() -> None:
    """Restores shape only; dropped values are gone, every row comes back as 0."""
    op.add_column(
        "action_items",
        sa.Column(
            "confidence",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
