"""Integration setup — a throwaway real database (note2action_test), rebuilt
each run: create → migrate (real RLS) → swap SessionLocal → truncate per test."""

import os
import subprocess
from pathlib import Path

import app.core.db as core_db
import app.main as main_module
import app.repositories.postgres.session as pg_session
import app.repositories.postgres.users as pg_users
import pytest
from app.repositories.postgres import build_postgres_repositories
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

API_DIR = Path(__file__).resolve().parents[2]

SERVER = "localhost:5432"
TEST_DB = "note2action_test"
# Admin role: DDL powers, BYPASSES RLS — used only to create/migrate/wipe.
ADMIN_URL = f"postgresql+psycopg://postgres:postgres@{SERVER}"
# App role: what production connects as — RLS applies (owners bypass it).
APP_URL = (
    f"postgresql+psycopg://note2action_app:note2action_app_dev"
    f"@{SERVER}/{TEST_DB}"
)


@pytest.fixture(scope="session")
def integration_db():
    """Once per run: rebuild note2action_test and migrate it; yields the
    app-role sessionmaker + an admin engine for truncation."""
    admin = create_engine(
        f"{ADMIN_URL}/postgres", isolation_level="AUTOCOMMIT"
    )
    try:
        with admin.connect() as conn:
            # FORCE kicks any lingering connections from a previous run.
            conn.execute(
                text(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
            )
            conn.execute(text(f"CREATE DATABASE {TEST_DB}"))
    except OperationalError:
        pytest.fail(
            "Postgres isn't reachable on localhost:5432 — start it first:"
            "  docker compose up -d postgres",
            pytrace=False,
        )

    # The real migrations build the schema AND the RLS policies — the test
    # database matches production law exactly, not a hand-copied schema.
    subprocess.run(
        [str(API_DIR / ".venv" / "bin" / "alembic"), "upgrade", "head"],
        cwd=API_DIR,
        env={
            **os.environ,
            "DATABASE_URL": f"{ADMIN_URL}/{TEST_DB}",
            "MIGRATIONS_DATABASE_URL": f"{ADMIN_URL}/{TEST_DB}",
        },
        check=True,
        capture_output=True,
    )

    app_engine = create_engine(APP_URL)
    admin_test = create_engine(
        f"{ADMIN_URL}/{TEST_DB}", isolation_level="AUTOCOMMIT"
    )
    yield sessionmaker(bind=app_engine), admin_test
    app_engine.dispose()
    admin_test.dispose()
    admin.dispose()


@pytest.fixture(autouse=True)
def postgres_app(integration_db, monkeypatch):
    """Point the app at the test DB and wipe it. Runs AFTER the outer
    fresh_repository fixture, so the Postgres repos overwrite the fakes."""
    test_sessionmaker, admin = integration_db
    # Each module imported SessionLocal by name at import time — patch the
    # copy each one actually calls, not just the original in core/db.py.
    monkeypatch.setattr(core_db, "SessionLocal", test_sessionmaker)
    monkeypatch.setattr(pg_session, "SessionLocal", test_sessionmaker)
    monkeypatch.setattr(pg_users, "SessionLocal", test_sessionmaker)
    main_module.app.state.repositories = build_postgres_repositories()
    # Admin truncate (RLS doesn't bind admins); RESTART IDENTITY makes row
    # ids deterministic (1, 2, …) in every test.
    with admin.connect() as conn:
        conn.execute(
            text(
                "TRUNCATE action_items, meetings, users "
                "RESTART IDENTITY CASCADE"
            )
        )
    yield
