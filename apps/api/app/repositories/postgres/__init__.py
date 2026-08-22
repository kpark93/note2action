"""Assembles the three Postgres-backed repositories.

Called by app/main.py when REPOSITORY == "postgres" (core/config.py).
Path: app/main.py → [this file] → postgres/{users,items,meetings}.py
→ Postgres (with row-level security, via postgres/session.py).
"""

from app.repositories.protocols import Repositories

from .items import PostgresItemRepository
from .meetings import PostgresMeetingRepository
from .users import PostgresUserRepository


def build_postgres_repositories() -> Repositories:
    """Assemble the three Postgres repositories, each opening its own
    RLS-scoped session per call (see postgres/session.py)."""
    return Repositories(
        users=PostgresUserRepository(),
        items=PostgresItemRepository(),
        meetings=PostgresMeetingRepository(),
    )
