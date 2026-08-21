// Typed API calls for action items, through the `/api` dev proxy.
//
// This is the wire↔view border: the API says `null` for "none"; the UI's
// inputs say "". Both translations live here and nowhere else.
import {
  ItemsResponse,
  SaveToTasksResponse,
  type ActionItem as WireActionItem,
  type ActionItemPatch,
} from "@note2action/shared";
import { request } from "@/lib/http";
import type { ActionItem } from "@/domain/items/items.types";

function fromWire(item: WireActionItem): ActionItem {
  return { ...item, due: item.due ?? "", note: item.note ?? undefined };
}

/** View-model patch: `due: ""` means "clear the date" (wire: `null`). */
export type ItemPatch = Omit<ActionItemPatch, "due"> & { due?: string };

function toWirePatch(patch: ItemPatch): ActionItemPatch {
  const { due, ...rest } = patch;
  return due === undefined ? rest : { ...rest, due: due || null };
}

export async function fetchItems(): Promise<ActionItem[]> {
  const { items } = await request("/api/items", { schema: ItemsResponse });
  return items.map(fromWire);
}

export async function patchItem(id: number, patch: ItemPatch): Promise<void> {
  await request(`/api/items/${id}`, {
    method: "PATCH",
    body: toWirePatch(patch),
  });
}

export async function deleteItem(id: number): Promise<void> {
  await request(`/api/items/${id}`, { method: "DELETE" });
}

/** "Save N to Tasks": one batch call; returns how many items were saved. */
export async function saveAllToTasks(): Promise<number> {
  const { updated } = await request("/api/items/save-to-tasks", {
    method: "POST",
    schema: SaveToTasksResponse,
  });
  return updated;
}
