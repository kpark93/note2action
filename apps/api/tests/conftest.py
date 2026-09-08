"""Shared test setup — every test runs against a real throwaway Postgres
(note2action_test): create → migrate (real RLS) → truncate + reseed per test.
The in-memory fake is gone (ADR-0004); one implementation, one behavior."""

import os
import subprocess
from pathlib import Path

import app.core.db as core_db
import app.main as main_module
import app.repositories.postgres.session as pg_session
import app.repositories.postgres.users as pg_users
import pytest
from app.core.security import VerifiedUser
from app.repositories.postgres import build_postgres_repositories
from jwt.exceptions import InvalidTokenError
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

API_DIR = Path(__file__).resolve().parents[1]

SERVER = "localhost:5432"
TEST_DB = "note2action_test"
# Admin role: DDL powers, BYPASSES RLS — used only to create/migrate/wipe.
ADMIN_URL = f"postgresql+psycopg://postgres:postgres@{SERVER}"
# App role: what production connects as — RLS applies (owners bypass it).
APP_URL = f"postgresql+psycopg://note2action_app:note2action_app_dev@{SERVER}/{TEST_DB}"

# The seeded account every plain-AUTH test acts as. With the fake verifier
# below, the bearer token simply IS the Clerk user id — no crypto involved.
SEED_CLERK_ID = "user_seed"
AUTH = {"Authorization": f"Bearer {SEED_CLERK_ID}"}

# Reseeded before every test (after TRUNCATE … RESTART IDENTITY, so the ids
# are always: user 1, meeting 1, items 1 and 2).
SEED_SQL = """
INSERT INTO users (name, clerk_id) VALUES ('Seed User', 'user_seed');
INSERT INTO meetings (user_id, title, raw_notes, captured_at) VALUES
  (1, 'Kickoff sync',
   'John to draft the project proposal. Jane emails the design mockups.',
   '2026-08-11T09:00:00+00:00');
INSERT INTO action_items
  (meeting_id, user_id, title, owner, due, priority, saved, note, status,
   completed) VALUES
  (1, 1, 'Draft the project proposal', 'John Doe', NULL, 'High', false,
   NULL, 'Not started', NULL),
  (1, 1, 'Email the design mockups', 'Jane Doe', NULL, 'High', false,
   NULL, 'Not started', NULL);
"""


class FakeVerifier:
    """Test twin of ClerkJWKSVerifier — no keys, no network. "user_…" tokens
    verify as that user (optional name after a pipe); anything else rejects."""

    def verify(self, token: str) -> VerifiedUser:
        if not token.startswith("user_"):
            raise InvalidTokenError("not a valid test token")
        clerk_id, _, name = token.partition("|")
        return VerifiedUser(clerk_id=clerk_id, name=name or None)


@pytest.fixture(scope="session")
def test_db():
    """Once per run: rebuild note2action_test and migrate it; yields the
    app-role sessionmaker + an admin engine for truncation."""
    admin = create_engine(f"{ADMIN_URL}/postgres", isolation_level="AUTOCOMMIT")
    try:
        with admin.connect() as conn:
            # FORCE kicks any lingering connections from a previous run.
            conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)"))
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
    admin_test = create_engine(f"{ADMIN_URL}/{TEST_DB}", isolation_level="AUTOCOMMIT")
    yield sessionmaker(bind=app_engine), admin_test
    app_engine.dispose()
    admin_test.dispose()
    admin.dispose()


@pytest.fixture(autouse=True)
def fresh_database(test_db, monkeypatch):
    """Point the app at the test DB, wipe it, reseed, install the fake
    verifier — every test starts from the same three seeded rows."""
    test_sessionmaker, admin = test_db
    # Each module imported SessionLocal by name at import time — patch the
    # copy each one actually calls, not just the original in core/db.py.
    monkeypatch.setattr(core_db, "SessionLocal", test_sessionmaker)
    monkeypatch.setattr(pg_session, "SessionLocal", test_sessionmaker)
    monkeypatch.setattr(pg_users, "SessionLocal", test_sessionmaker)
    main_module.app.state.repositories = build_postgres_repositories()
    main_module.app.state.token_verifier = FakeVerifier()
    # Admin truncate (RLS doesn't bind admins); RESTART IDENTITY makes row
    # ids deterministic (1, 2, …) in every test.
    with admin.connect() as conn:
        conn.execute(
            text("TRUNCATE action_items, meetings, users RESTART IDENTITY CASCADE")
        )
        conn.execute(text(SEED_SQL))
    yield
