"""Item use-cases. Thin today; business rules land here, not in routes.

Called by app/api/routes/items.py; calls the ItemRepository protocol
(app/repositories/). Services never import FastAPI — routes translate
None/False returns into 404s.
Path §1 [hop 10/15]: route (hops 8–9) → [this file] → ItemRepository
(repositories/postgres/items.py, hop 11).
"""

from app.repositories.protocols import ItemRepository
from app.schemas.items import ActionItem, ActionItemPatch


def list_items(items: ItemRepository, user_id: int) -> list[ActionItem]:
    """Every item the given user owns."""
    return items.list_items(user_id)


def update_item(
    items: ItemRepository, user_id: int, item_id: int, patch: ActionItemPatch
) -> ActionItem | None:
    """Apply a partial edit; None if the item is missing or not theirs
    (the route turns that into a 404)."""
    return items.update_item(user_id, item_id, patch)


def delete_item(items: ItemRepository, user_id: int, item_id: int) -> bool:
    """Delete one item; False if it's missing or not theirs."""
    return items.delete_item(user_id, item_id)


def save_all_to_tasks(items: ItemRepository, user_id: int) -> int:
    """Mark every not-yet-saved, not-Done item as saved; returns the
    count changed."""
    return items.save_all_to_tasks(user_id)
