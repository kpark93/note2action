"""Action item routes — list, edit, delete, bulk-save. Each handler resolves the
user (api/deps.py), then delegates. Path §1 [hop 8/15]: → services/items.py."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import current_user_id, get_repositories
from app.core.cursor import CursorError
from app.repositories.protocols import Repositories
from app.schemas import (
    ActionItem,
    ActionItemPatch,
    ItemsPage,
    ItemSummary,
    SaveToTasksResponse,
)
from app.services import items as items_service

router = APIRouter()


@router.get("/api/items", response_model=ItemsPage)
def list_items(
    view: Literal["tasks", "history", "review"] | None = None,
    owner: str | None = None,
    status: str | None = None,
    priority: str | None = None,
    cursor: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> ItemsPage:
    """GET /api/items: bare = the legacy full list; with `view` = one keyset
    page (services/items.py list_page). A cursor we didn't mint is a 422."""
    if view is None:
        return ItemsPage(
            items=items_service.list_items(repos.items, user_id),
            nextCursor=None,
        )
    try:
        return items_service.list_page(
            repos.items, user_id, view, owner, status, priority, cursor, limit
        )
    except CursorError as exc:
        raise HTTPException(status_code=422, detail="Invalid cursor") from exc


# Declared before /api/items/{item_id}: route order decides whether "summary"
# is a path segment or a (failing) integer item id.
@router.get("/api/items/summary", response_model=ItemSummary)
def item_summary(
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> ItemSummary:
    """GET /api/items/summary: sidebar counts via services/items.py."""
    return items_service.summarize(repos.items, user_id)


@router.get("/api/items/{item_id}", response_model=ActionItem)
def get_item(
    item_id: int,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> ActionItem:
    """GET /api/items/{id}: one item; 404-not-403 for missing/not theirs."""
    item = items_service.get_item(repos.items, user_id, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


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
