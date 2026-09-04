/** Typed API calls for action items — the wire↔view border: API `null` ⇄ UI ""
 * translations live here only. Path §1 [hop 4/15]: → lib/http.ts (hop 5). */
import {
  ActionItem as WireActionItem,
  ItemsPage,
  ItemSummary,
  SaveToTasksResponse,
  type ActionItemPatch,
} from "@note2action/shared";
import { request } from "@/lib/http";
import type { ActionItem } from "@/domain/items/items.types";

/** Wire → view-model: `null` becomes "" (due) / undefined (note). */
function fromWire(item: WireActionItem): ActionItem {
  return { ...item, due: item.due ?? "", note: item.note ?? undefined };
}

/** View-model patch: `due: ""` means "clear the date" (wire: `null`). */
export type ItemPatch = Omit<ActionItemPatch, "due"> & { due?: string };

/** View-model patch → wire: `due: ""` goes out as `null`. */
function toWirePatch(patch: ItemPatch): ActionItemPatch {
  const { due, ...rest } = patch;
  return due === undefined ? rest : { ...rest, due: due || null };
}

/** How many rows each infinite-scroll page asks the API for. */
export const PAGE_LIMIT = 20;

/** One keyset page in view-model form; nextCursor null = last page. */
export interface ItemsPageVM {
  items: ActionItem[];
  nextCursor: string | null;
}

/** "All" is a UI sentinel, not a server filter — omit the param entirely. */
function filterParam(params: URLSearchParams, key: string, value: string) {
  if (value !== "All") params.set(key, value);
}

/** GET /api/items?view=tasks — one page of saved open items, due-date order. */
export async function fetchTasksPage(
  owner: string,
  status: string,
  priority: string,
  cursor: string | null,
): Promise<ItemsPageVM> {
  const params = new URLSearchParams({
    view: "tasks",
    limit: String(PAGE_LIMIT),
  });
  filterParam(params, "owner", owner);
  filterParam(params, "status", status);
  filterParam(params, "priority", priority);
  if (cursor) params.set("cursor", cursor);
  const page = await request(`/api/items?${params}`, { schema: ItemsPage });
  return { items: page.items.map(fromWire), nextCursor: page.nextCursor };
}

/** GET /api/items?view=history — one page of Done items, newest-closed first. */
export async function fetchHistoryPage(
  owner: string,
  cursor: string | null,
): Promise<ItemsPageVM> {
  const params = new URLSearchParams({
    view: "history",
    limit: String(PAGE_LIMIT),
  });
  filterParam(params, "owner", owner);
  if (cursor) params.set("cursor", cursor);
  const page = await request(`/api/items?${params}`, { schema: ItemsPage });
  return { items: page.items.map(fromWire), nextCursor: page.nextCursor };
}

/** GET /api/items?view=review — the whole (bounded) pending queue. */
export async function fetchReviewItems(): Promise<ActionItem[]> {
  const page = await request("/api/items?view=review", { schema: ItemsPage });
  return page.items.map(fromWire);
}

/** GET /api/items/{id} — one item; the detail modal's source of truth. */
export async function fetchItem(id: number): Promise<ActionItem> {
  const item = await request(`/api/items/${id}`, { schema: WireActionItem });
  return fromWire(item);
}

/** GET /api/items/summary — sidebar + History-stat counts, no rows. */
export async function fetchSummary(): Promise<ItemSummary> {
  return request("/api/items/summary", { schema: ItemSummary });
}

/** PATCH one item; returns the server's copy — `completed` is stamped there. */
export async function patchItem(
  id: number,
  patch: ItemPatch,
): Promise<ActionItem> {
  const item = await request(`/api/items/${id}`, {
    method: "PATCH",
    body: toWirePatch(patch),
    schema: WireActionItem,
  });
  return fromWire(item);
}

/** DELETE one item; the server returns 204 (no body). */
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
