"""Action item routes; handlers resolve the user then delegate to services/items.py."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import current_user_id, get_repositories
from app.core.cursor import CursorError
from app.repositories.protocols import Repositories
from app.schemas import (
    ActionItem,
    ActionItemPatch,
    BulkUpdateResponse,
    ItemsBulkPatch,
    ItemsPage,
    ItemSummary,
)
from app.services import items as items_service

router = APIRouter()


@router.get("/api/items", response_model=ItemsPage)
def list_items(
    view: Literal["tasks", "history", "review"],
    status: str | None = None,
    priority: str | None = None,
    cursor: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> ItemsPage:
    """GET /api/items: one keyset page of the view's walk; a foreign cursor is a 422."""
    try:
        return items_service.list_page(
            repos.items, user_id, view, status, priority, cursor, limit
        )
    except CursorError as exc:
        raise HTTPException(status_code=422, detail="Invalid cursor") from exc


# Before /api/items/{item_id}: route order keeps "summary" from parsing as an id.
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
    """PATCH /api/items/{id}: 404 not 403 when missing or not theirs — no leak."""
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
    """DELETE /api/items/{id}: same 404-not-403 rule as update_item."""
    if not items_service.delete_item(repos.items, user_id, item_id):
        raise HTTPException(status_code=404, detail="Item not found")


@router.patch("/api/items", response_model=BulkUpdateResponse)
def bulk_update_items(
    patch: ItemsBulkPatch,
    view: Literal["review"],
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> BulkUpdateResponse:
    """PATCH /api/items?view=review: promote the review queue; other views/bodies 422."""
    return BulkUpdateResponse(
        updated=items_service.save_all_to_tasks(repos.items, user_id)
    )
