// Every TanStack cache key, in one place below the domains: keys are
// addresses, not behavior, so cross-domain invalidation (delete an item →
// refresh meeting counts) never imports another domain's hook module.
// Path: domain/*/(queries|store) → [this file]. (request-paths.md §1-3)

export const itemsKey = ["items"] as const;
export const healthKey = ["health"] as const;

// Meetings have TWO cached shapes (Meeting[] lists, MeetingDetail per id),
// so the key namespaces by kind — ["meetings", 3] alone would let a list
// with limit 3 and the detail for id 3 share one cache slot.
export const meetingsKey = {
  all: ["meetings"] as const,
  list: (limit: number) => [...meetingsKey.all, "list", limit] as const,
  detail: (id: number) => [...meetingsKey.all, "detail", id] as const,
};
