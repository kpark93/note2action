"""Item use-cases. Thin today; business rules land here, not in routes."""

from app.repositories.protocols import ItemRepository
from app.schemas.items import ActionItem, ActionItemPatch


def list_items(items: ItemRepository, user_id: int) -> list[ActionItem]:
    return items.list_items(user_id)


def update_item(
    items: ItemRepository, user_id: int, item_id: int, patch: ActionItemPatch
) -> ActionItem | None:
    return items.update_item(user_id, item_id, patch)


def delete_item(items: ItemRepository, user_id: int, item_id: int) -> bool:
    return items.delete_item(user_id, item_id)


def save_all_to_tasks(items: ItemRepository, user_id: int) -> int:
    return items.save_all_to_tasks(user_id)
