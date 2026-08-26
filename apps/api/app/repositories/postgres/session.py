"""Opens a DB session stamped with the caller's identity so Postgres RLS
enforces ownership even if app code has a bug. Next hop: core/db.py → Postgres."""

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db import SessionLocal


@contextmanager
def rls_session(user_id: int) -> Iterator[Session]:
    """Session carrying identity for RLS via SET LOCAL, scoped to this
    transaction; unset means RLS sees NULL — fails closed."""
    with SessionLocal() as session:
        session.execute(
            text("SELECT set_config('app.user_id', :uid, true)"),
            {"uid": str(user_id)},
        )
        yield session
