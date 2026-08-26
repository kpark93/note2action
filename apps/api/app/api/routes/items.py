"""Action item routes — list, edit, delete, bulk-save. Each handler resolves the
user (api/deps.py), then delegates. Path §1 [hop 8/15]: → services/items.py."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import current_user_id, get_repositories
from app.repositories.protocols import Repositories
from app.schemas import (
    ActionItem,
    ActionItemPatch,
    ItemsResponse,
    SaveToTasksResponse,
)
from app.services import items as items_service

router = APIRouter()


@router.get("/api/items", response_model=ItemsResponse)
def list_items(
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> ItemsResponse:
    """GET /api/items: delegates to services/items.py list_items."""
    return ItemsResponse(items=items_service.list_items(repos.items, user_id))


@router.patch("/api/items/{item_id}", response_model=ActionItem)
def update_item(
    item_id: int,
    patch: ActionItemPatch,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> ActionItem:
    """PATCH /api/items/{id}: delegates to services/items.py
    update_item; 404s not 403s when missing/not theirs — no leak."""
    item = items_service.update_item(repos.items, user_id, item_id, patch)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/api/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> None:
    """DELETE /api/items/{id}: delegates to services/items.py
    delete_item; same 404-not-403 rule as update_item."""
    if not items_service.delete_item(repos.items, user_id, item_id):
        raise HTTPException(status_code=404, detail="Item not found")


@router.post("/api/items/save-to-tasks", response_model=SaveToTasksResponse)
def save_to_tasks(
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> SaveToTasksResponse:
    """POST /api/items/save-to-tasks: delegates to services/items.py
    save_all_to_tasks; returns how many items changed."""
    return SaveToTasksResponse(
        updated=items_service.save_all_to_tasks(repos.items, user_id)
    )
