"""Assembles the three Postgres repositories for app/main.py."""

from app.repositories.protocols import Repositories

from .items import PostgresItemRepository
from .meetings import PostgresMeetingRepository
from .users import PostgresUserRepository


def build_postgres_repositories() -> Repositories:
    """Three Postgres repositories, each opening an RLS-scoped session per call."""
    return Repositories(
        users=PostgresUserRepository(),
        items=PostgresItemRepository(),
        meetings=PostgresMeetingRepository(),
    )
