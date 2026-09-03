from datetime import date

from app.models import ActionItem as ActionItemRow
from app.repositories.mappers import to_wire
from app.repositories.memory import MemoryState, MemoryUserRepository


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


def test_get_or_create_user_name_laws() -> None:
    """Same laws both repository implementations must obey (white-box on the fake)."""
    repo = MemoryUserRepository(MemoryState())

    # New user with a name claim → the name sticks.
    jane = repo.get_or_create_user("user_jane", "Jane Doe")
    assert repo.state.user_names[jane] == "Jane Doe"

    # New user without a name claim → placeholder.
    anon = repo.get_or_create_user("user_anon", None)
    assert repo.state.user_names[anon] == "New user"

    # Same clerk id always maps to the same user…
    assert repo.get_or_create_user("user_jane", "Jane Doe") == jane

    # …a changed claim refreshes the name (Clerk is the profile's source of
    # truth), and a missing claim never erases what we have.
    repo.get_or_create_user("user_jane", "Jane Smith")
    assert repo.state.user_names[jane] == "Jane Smith"
    repo.get_or_create_user("user_jane", None)
    assert repo.state.user_names[jane] == "Jane Smith"
