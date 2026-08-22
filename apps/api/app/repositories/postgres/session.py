from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db import SessionLocal


@contextmanager
def rls_session(user_id: int) -> Iterator[Session]:
    """A session whose transaction carries the caller's identity for RLS.

    set_config(..., is_local => true) is `SET LOCAL`: the value lives only
    until this transaction ends, so pooled connections can never leak one
    request's identity into the next. Postgres' policies compare every row
    against app.user_id — if any code path forgets to set it, the policies
    see NULL and return zero rows: forgetting fails closed, not open.
    """
    with SessionLocal() as session:
        session.execute(
            text("SELECT set_config('app.user_id', :uid, true)"),
            {"uid": str(user_id)},
        )
        yield session
