"""Item use-cases — thin today; business rules land here, not routes. Services
never import FastAPI. Path §1 [hop 10/15]: route → here → ItemRepository."""

from datetime import date

from app.core.cursor import CursorError, decode_cursor, encode_cursor
from app.repositories.protocols import ItemRepository
from app.schemas.items import (
    ActionItem,
    ActionItemPatch,
    ItemsPage,
    ItemSummary,
)


def _tasks_cursor(raw: str) -> dict:
    """Decode + shape-check a tasks cursor: {"d": ISO date | None, "i": id}.
    Anything else is a tampered/foreign cursor → CursorError → 422."""
    payload = decode_cursor(raw)
    d, i = payload.get("d"), payload.get("i")
    if not isinstance(i, int) or not (d is None or isinstance(d, str)):
        raise CursorError("bad tasks cursor shape")
    if d is not None:
        try:
            date.fromisoformat(d)
        except ValueError as exc:
            raise CursorError("bad cursor date") from exc
    return {"d": d, "i": i}


def _dated_cursor(raw: str, key: str) -> dict:
    """Decode + shape-check a {key: ISO date, "i": id} cursor (history)."""
    payload = decode_cursor(raw)
    c, i = payload.get(key), payload.get("i")
    if not isinstance(i, int) or not isinstance(c, str):
        raise CursorError("bad cursor shape")
    try:
        date.fromisoformat(c)
    except ValueError as exc:
        raise CursorError("bad cursor date") from exc
    return {key: c, "i": i}


def list_page(
    items: ItemRepository,
    user_id: int,
    view: str,
    owner: str | None,
    status: str | None,
    priority: str | None,
    cursor_raw: str | None,
    limit: int,
) -> ItemsPage:
    """One page of the given view. Review is a bounded queue — always the
    whole thing; tasks/history walk their keysets via opaque cursors."""
    if view == "review":
        return ItemsPage(items=items.list_review(user_id), nextCursor=None)
    if view == "tasks":
        cursor = _tasks_cursor(cursor_raw) if cursor_raw else None
        rows, nxt = items.list_tasks_page(
            user_id, owner, status, priority, cursor, limit
        )
    else:
        cursor = _dated_cursor(cursor_raw, "c") if cursor_raw else None
        rows, nxt = items.list_history_page(user_id, owner, cursor, limit)
    return ItemsPage(
        items=rows, nextCursor=encode_cursor(nxt) if nxt else None
    )


def get_item(
    items: ItemRepository, user_id: int, item_id: int
) -> ActionItem | None:
    """One item; None → the route's 404-not-403 rule applies."""
    return items.get_item(user_id, item_id)


def summarize(items: ItemRepository, user_id: int) -> ItemSummary:
    """Counts for the sidebar — no rows cross the wire."""
    return items.count_summary(user_id)


def update_item(
    items: ItemRepository, user_id: int, item_id: int, patch: ActionItemPatch
) -> ActionItem | None:
    """Calls ItemRepository.update_item; None if missing or not
    theirs (route turns that into a 404)."""
    return items.update_item(user_id, item_id, patch)


def delete_item(items: ItemRepository, user_id: int, item_id: int) -> bool:
    """Calls ItemRepository.delete_item; False if missing/not theirs."""
    return items.delete_item(user_id, item_id)


def save_all_to_tasks(items: ItemRepository, user_id: int) -> int:
    """Calls ItemRepository.save_all_to_tasks; returns the count
    changed."""
    return items.save_all_to_tasks(user_id)
