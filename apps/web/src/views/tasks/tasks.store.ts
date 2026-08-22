// Client-only UI state for the Tasks screen — the three filter dropdowns.
// The tasks themselves are server state, read separately via useItemsQuery
// (domain/items/items.queries.ts).
// Path: tasks.view.tsx → [this file] (leaf zustand store).
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** View-local UI state for the Tasks screen (owner/status/priority filters). */
interface TasksState {
  filterOwner: string;
  filterStatus: string;
  filterPriority: string;
  setFilterOwner: (owner: string) => void;
  setFilterStatus: (status: string) => void;
  setFilterPriority: (priority: string) => void;
  clearFilters: () => void;
}

export const useTasksStore = create<TasksState>()(
  devtools(
    (set) => ({
      filterOwner: "All",
      filterStatus: "All",
      filterPriority: "All",
      setFilterOwner: (filterOwner) =>
        set({ filterOwner }, false, "tasks/setFilterOwner"),
      setFilterStatus: (filterStatus) =>
        set({ filterStatus }, false, "tasks/setFilterStatus"),
      setFilterPriority: (filterPriority) =>
        set({ filterPriority }, false, "tasks/setFilterPriority"),
      clearFilters: () =>
        set(
          { filterOwner: "All", filterStatus: "All", filterPriority: "All" },
          false,
          "tasks/clearFilters",
        ),
    }),
    { name: "TasksStore" },
  ),
);
