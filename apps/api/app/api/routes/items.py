from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import current_user_id, get_repositories
from app.repositories.protocols import Repositories
from app.schemas import ActionItem, ActionItemPatch, ItemsResponse, SaveToTasksResponse
from app.services import items as items_service

router = APIRouter()


@router.get("/api/items", response_model=ItemsResponse)
def list_items(
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> ItemsResponse:
    return ItemsResponse(items=items_service.list_items(repos.items, user_id))


@router.patch("/api/items/{item_id}", response_model=ActionItem)
def update_item(
    item_id: int,
    patch: ActionItemPatch,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> ActionItem:
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
    if not items_service.delete_item(repos.items, user_id, item_id):
        raise HTTPException(status_code=404, detail="Item not found")


@router.post("/api/items/save-to-tasks", response_model=SaveToTasksResponse)
def save_to_tasks(
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> SaveToTasksResponse:
    return SaveToTasksResponse(updated=items_service.save_all_to_tasks(repos.items, user_id))
