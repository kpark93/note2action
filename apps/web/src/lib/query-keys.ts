/** Every TanStack cache key in one place — keys are addresses, not behavior, so
 * cross-domain invalidation never imports another domain's hook module. */

export const itemsKey = ["items"] as const;
export const healthKey = ["health"] as const;

/** Meetings cache two shapes (lists + per-id detail), so keys namespace by kind
 * — a bare ["meetings", 3] would collide a limit-3 list with detail id 3. */
export const meetingsKey = {
  all: ["meetings"] as const,
  list: (limit: number) => [...meetingsKey.all, "list", limit] as const,
  detail: (id: number) => [...meetingsKey.all, "detail", id] as const,
};
