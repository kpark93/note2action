/** Every TanStack cache key in one place — keys are addresses, not behavior, so
 * cross-domain invalidation never imports another domain's hook module. */

/** Items cache holds several shapes (review list, per-view pages, counts,
 * detail) — all under one "items" root so one invalidate reaches them all. */
export const itemsKey = {
  all: ["items"] as const,
  review: ["items", "review"] as const,
  /** Filters live in the key: changing one is a new server-side query. */
  tasks: (status: string, priority: string) =>
    ["items", "tasks", status, priority] as const,
  /** Prefix for every cached tasks filter combination at once. */
  tasksAll: ["items", "tasks"] as const,
  history: ["items", "history"] as const,
  summary: ["items", "summary"] as const,
  detail: (id: number) => ["items", "detail", id] as const,
};

/** Mutation key for the capture flow — lets useMutationState find in-flight
 * extractions across remounts. */
export const extractKey = ["extract-capture"] as const;

/** Meetings cache three shapes (capped lists, infinite pages, per-id detail);
 * keys namespace by kind so a limit-3 list never collides with detail id 3. */
export const meetingsKey = {
  all: ["meetings"] as const,
  infinite: ["meetings", "infinite"] as const,
  detail: (id: number | null) => [...meetingsKey.all, "detail", id] as const,
  /** Prefix for every cached meeting detail — the only meetings shape that
   * carries item state (the modal's status pills). */
  detailAll: ["meetings", "detail"] as const,
};
