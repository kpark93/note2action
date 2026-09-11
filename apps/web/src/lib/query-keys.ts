/** Every TanStack cache key — keys are addresses, so domains never cross-import. */

/** Several item shapes under one "items" root so one invalidate reaches them all. */
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

/** Capture mutation key — lets useMutationState find in-flight extractions. */
export const extractKey = ["extract-capture"] as const;

/** Three meeting shapes; keys namespace by kind so list 3 never collides with id 3. */
export const meetingsKey = {
  all: ["meetings"] as const,
  infinite: ["meetings", "infinite"] as const,
  detail: (id: number | null) => [...meetingsKey.all, "detail", id] as const,
  /** Prefix for every cached meeting detail — the only meetings shape with item state. */
  detailAll: ["meetings", "detail"] as const,
};
