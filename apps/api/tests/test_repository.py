from datetime import date

from app.models import ActionItem as ActionItemRow
from app.repository import to_wire


def test_to_wire_maps_row_fields_onto_the_wire_schema() -> None:
    row = ActionItemRow(
        id=7,
        meeting_id=3,
        title="Follow up with design",
        owner="Jane",
        due=date(2026, 8, 20),
        priority="Medium",
        confidence=80,
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
    assert item.confidence == 80
    assert item.saved is True
    assert item.note == "from notes"
    assert item.status == "In progress"
    assert item.completed is None
