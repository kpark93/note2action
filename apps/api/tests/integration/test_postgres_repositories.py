"""Real-Postgres repository tests — the in-memory fake's blind spots: RLS
enforcement, commit ordering, SQL truth. Needs Postgres running."""

from datetime import date

import app.main as main_module
import app.repositories.postgres.session as pg_session
import pytest
from app.schemas.items import ActionItemPatch
from app.schemas.meetings import CreateMeetingRequest, ExtractedItem
from sqlalchemy import create_engine, text
from sqlalchemy.exc import DataError
from sqlalchemy.pool import NullPool

from tests.integration.conftest import APP_URL

pytestmark = pytest.mark.integration


@pytest.fixture()
def repos():
    """The Postgres-backed Repositories bundle conftest installed."""
    return main_module.app.state.repositories


def seed(repos, clerk_id: str = "user_alice", items: int = 2):
    """One user + one meeting with N items; returns (user_id, item_ids)."""
    user_id = repos.users.get_or_create_user(clerk_id, None)
    created = repos.meetings.create_meeting(
        user_id,
        CreateMeetingRequest(
            title="Standup",
            rawNotes="raw notes",
            items=[
                ExtractedItem(
                    title=f"Task {i}",
                    owner="Kyle",
                    priority="Medium",
                    due="",
                    note="",
                )
                for i in range(items)
            ],
        ),
    )
    return user_id, [item.id for item in created.items]


def test_done_patch_survives_commit(repos):
    """The 500-on-Done regression: to_wire must run BEFORE commit(),
    because the SET LOCAL RLS identity dies with the transaction."""
    user_id, item_ids = seed(repos)

    result = repos.items.update_item(
        user_id, item_ids[0], ActionItemPatch(status="Done")
    )

    assert result is not None
    assert result.status == "Done"
    assert result.completed == date.today().isoformat()
    # Fresh session: the write really committed, not just the response.
    history, _ = repos.items.list_history_page(user_id, None, None, 50)
    persisted = {i.id: i for i in history}
    assert persisted[item_ids[0]].status == "Done"
    assert persisted[item_ids[0]].completed == date.today().isoformat()


def test_users_see_only_their_own_items(repos):
    alice, alice_items = seed(repos, "user_alice", items=2)
    bob, bob_items = seed(repos, "user_bob", items=1)

    assert {i.id for i in repos.items.list_review(alice)} == set(alice_items)
    assert {i.id for i in repos.items.list_review(bob)} == set(bob_items)


def test_update_foreign_item_returns_none(repos):
    alice, alice_items = seed(repos, "user_alice")
    bob, _ = seed(repos, "user_bob", items=1)

    assert (
        repos.items.update_item(
            bob, alice_items[0], ActionItemPatch(status="Done")
        )
        is None
    )
    # Alice's row is untouched by the failed cross-user patch.
    alice_view = {i.id: i for i in repos.items.list_review(alice)}
    assert alice_view[alice_items[0]].status == "Not started"


def test_delete_foreign_item_returns_false(repos):
    alice, alice_items = seed(repos, "user_alice")
    bob, _ = seed(repos, "user_bob", items=1)

    assert repos.items.delete_item(bob, alice_items[0]) is False
    assert repos.items.delete_item(alice, alice_items[0]) is True
    assert {i.id for i in repos.items.list_review(alice)} == {alice_items[1]}


def test_save_all_to_tasks_counts_only_pending(repos):
    user_id, item_ids = seed(repos, items=3)
    # A Done item must not be swept into Tasks by the bulk save.
    repos.items.update_item(user_id, item_ids[0], ActionItemPatch(status="Done"))

    assert repos.items.save_all_to_tasks(user_id) == 2
    # Second run: everything already saved or Done — nothing to do.
    assert repos.items.save_all_to_tasks(user_id) == 0


def test_rls_fails_closed_on_fresh_connection(repos):
    """A connection that never ran SET LOCAL sees ZERO rows — RLS compares
    user_id to NULL, and NULL matches nothing. Forgetting = no data leak."""
    seed(repos)

    fresh = create_engine(APP_URL, poolclass=NullPool)
    try:
        with fresh.connect() as conn:
            count = conn.execute(
                text("SELECT count(*) FROM action_items")
            ).scalar_one()
        assert count == 0
    finally:
        fresh.dispose()


def test_dead_identity_errors_instead_of_leaking(repos):
    """After commit, SET LOCAL's value degrades to '' and the policy's ::int
    cast ERRORS (the 500-on-Done mechanism) — loud, zero rows, fails closed."""
    seed(repos)

    with pg_session.SessionLocal() as session:
        session.execute(
            text("SELECT set_config('app.user_id', '999', true)")
        )
        session.commit()
        with pytest.raises(DataError):
            session.execute(text("SELECT count(*) FROM action_items"))
