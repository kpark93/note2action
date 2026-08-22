"""Item use-cases. Thin today; business rules land here, not routes.
Services never import FastAPI — routes translate None/False → 404s.
Path §1 [hop 10/15]: route (hops 8–9) → [this file] → ItemRepository
(repositories/postgres/items.py, hop 11).
"""

from app.repositories.protocols import ItemRepository
from app.schemas.items import ActionItem, ActionItemPatch


def list_items(items: ItemRepository, user_id: int) -> list[ActionItem]:
    """Calls ItemRepository.list_items; every item the user owns."""
    return items.list_items(user_id)


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
