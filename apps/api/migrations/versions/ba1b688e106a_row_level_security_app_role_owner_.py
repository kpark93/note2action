"""row-level security: app role + owner policies

Revision ID: ba1b688e106a
Revises: 3337459970d8
Create Date: 2026-08-19 20:14:38.180506

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ba1b688e106a'
down_revision: Union[str, Sequence[str], None] = '3337459970d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Row-Level Security: the database itself enforces per-user visibility.

    Three pieces:
    1. A low-privilege role the app connects as. RLS does NOT apply to
       superusers or table owners — connecting as `postgres` would silently
       bypass every policy (the classic gotcha).
    2. RLS enabled on the user-owned tables.
    3. Policies comparing each row's user_id to `app.user_id`, a per-
       transaction variable the API sets from the verified identity.
       current_setting(..., true) returns NULL when it's unset, and NULL
       compares false — so "forgot to set the user" fails CLOSED (zero rows).
    """
    # 1. The app's role. Dev-only password, committed knowingly for the local
    #    course setup — in production, roles/credentials are managed outside
    #    migrations (secret manager), never in git.
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
    # Table access (RLS filters rows; grants still gate the tables at all),
    # and sequences so INSERTs can draw ids.
    op.execute(
        "GRANT SELECT, INSERT, UPDATE, DELETE ON users, meetings, action_items "
        "TO note2action_app"
    )
    op.execute(
        "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO note2action_app"
    )

    # 2 + 3. Enable RLS and attach owner-only policies. USING = which rows are
    # visible/touchable; WITH CHECK = which rows may be written (blocks
    # INSERTing/UPDATEing a row onto someone else's user_id).
    # `users` deliberately has NO policy: identity lookup runs before the
    # caller's user id can exist — it's the bootstrap table.
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
    op.execute(
        "REVOKE ALL ON users, meetings, action_items FROM note2action_app"
    )
    op.execute(
        "REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM note2action_app"
    )
    op.execute("DROP ROLE IF EXISTS note2action_app")
