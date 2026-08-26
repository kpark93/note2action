"""Shape-shifting helpers for the Postgres repositories: DB rows in, wire
schemas out. Path §1 [hop 12/15]: postgres rows → here → schemas/items.py."""

from app.models import ActionItem as ActionItemRow
from app.schemas.items import ActionItem
from app.schemas.meetings import ExtractedItem


def to_wire(row: ActionItemRow, meeting_title: str) -> ActionItem:
    """DB row → wire schema. The meeting title is joined in by the caller."""
    return ActionItem(
        id=row.id,
        meetingId=row.meeting_id,
        meeting=meeting_title,
        title=row.title,
        owner=row.owner,
        due=row.due.isoformat() if row.due else None,
        priority=row.priority,
        confidence=row.confidence,
        saved=row.saved,
        note=row.note,
        status=row.status,
        completed=row.completed.isoformat() if row.completed else None,
    )


def new_item(
    item_id: int, meeting_id: int, meeting_title: str, extracted: ExtractedItem
) -> ActionItem:
    """A freshly captured item with the api-design.md birth defaults; `or None`
    translates the extractor's '' ("none") into a wire null."""
    return ActionItem(
        id=item_id,
        meetingId=meeting_id,
        meeting=meeting_title,
        title=extracted.title,
        owner=extracted.owner,
        due=extracted.due or None,
        priority=extracted.priority,
        confidence=extracted.confidence,
        saved=False,
        note=extracted.note or None,
        status="Not started",
        completed=None,
    )
