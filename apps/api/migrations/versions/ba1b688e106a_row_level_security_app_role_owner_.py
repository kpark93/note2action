"""row-level security: app role + owner policies"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ba1b688e106a"
down_revision: str | Sequence[str] | None = "3337459970d8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """RLS: the database enforces per-user visibility; unset app.user_id fails CLOSED."""
    # 1. The app's role — dev-only password; prod credentials live in a secret manager.
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'note2action_app') THEN
                CREATE ROLE note2action_app LOGIN PASSWORD 'note2action_app_dev';
            END IF;
        END
        $$
        """
    )
    # Table grants still gate access; sequence usage lets INSERTs draw ids.
    op.execute(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON users, meetings, action_items "
        "TO note2action_app"
    )
    op.execute(
        "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO note2action_app"
    )

    # 2+3. RLS + owner policies (USING reads, WITH CHECK writes); users has none.
    for table in ("meetings", "action_items"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(
            f"""
            CREATE POLICY {table}_owner_only ON {table}
            FOR ALL
            USING (user_id = current_setting('app.user_id', true)::int)
            WITH CHECK (user_id = current_setting('app.user_id', true)::int)
            """
        )


def downgrade() -> None:
    """Remove RLS (reverse order of upgrade)."""
    for table in ("action_items", "meetings"):
        op.execute(f"DROP POLICY {table}_owner_only ON {table}")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")
    op.execute("REVOKE ALL ON users, meetings, action_items FROM note2action_app")
    op.execute("REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM note2action_app")
    op.execute("DROP ROLE IF EXISTS note2action_app")
