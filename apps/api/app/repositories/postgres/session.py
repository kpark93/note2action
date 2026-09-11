"""DB session stamped with the caller's identity so RLS enforces ownership."""

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db import SessionLocal


@contextmanager
def rls_session(user_id: int) -> Iterator[Session]:
    """Identity via set_config for RLS, transaction-scoped; unset = NULL = fails closed."""
    with SessionLocal() as session:
        session.execute(
            text("SELECT set_config('app.user_id', :uid, true)"),
            {"uid": str(user_id)},
        )
        yield session
