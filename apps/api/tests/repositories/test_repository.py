from datetime import date

import app.main as main_module
from app.models import ActionItem as ActionItemRow
from app.models import User as UserRow
from app.repositories.mappers import to_wire
from sqlalchemy import select

from tests.conftest import APP_URL


def test_to_wire_maps_row_fields_onto_the_wire_schema() -> None:
    row = ActionItemRow(
        id=7,
        meeting_id=3,
        title="Follow up with design",
        owner="Jane",
        due=date(2026, 8, 20),
        priority="Medium",
        saved=True,
        note="from notes",
        status="In progress",
        completed=None,
    )

    item = to_wire(row, "Design review")

    assert item.id == 7
    assert item.meetingId == 3
    assert item.meeting == "Design review"
    assert item.title == "Follow up with design"
    assert item.owner == "Jane"
    assert item.due == "2026-08-20"
    assert item.priority == "Medium"
    assert item.saved is True
    assert item.note == "from notes"
    assert item.status == "In progress"
    assert item.completed is None


def _stored_name(clerk_id: str) -> str:
    """Read a user's persisted name straight off the table (no RLS on users)."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session

    engine = create_engine(APP_URL)
    try:
        with Session(engine) as session:
            return session.execute(
                select(UserRow.name).where(UserRow.clerk_id == clerk_id)
            ).scalar_one()
    finally:
        engine.dispose()


def test_get_or_create_user_name_laws() -> None:
    """The name laws, proven against the real implementation."""
    repo = main_module.app.state.repositories.users

    # New user with a name claim → the name sticks.
    jane = repo.get_or_create_user("user_jane", "Jane Doe")
    assert _stored_name("user_jane") == "Jane Doe"

    # New user without a name claim → placeholder.
    repo.get_or_create_user("user_anon", None)
    assert _stored_name("user_anon") == "New user"

    # Same clerk id always maps to the same user…
    assert repo.get_or_create_user("user_jane", "Jane Doe") == jane

    # …a changed claim refreshes the name; a missing claim never erases it.
    repo.get_or_create_user("user_jane", "Jane Smith")
    assert _stored_name("user_jane") == "Jane Smith"
    repo.get_or_create_user("user_jane", None)
    assert _stored_name("user_jane") == "Jane Smith"
