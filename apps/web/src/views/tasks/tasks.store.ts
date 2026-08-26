/** Client-only UI state for Tasks — the three filter dropdowns. The tasks
 * themselves are server state, read via useItemsQuery. */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Owner } from "@/domain/items/items.constants";
import type { Priority, Status } from "@/domain/items/items.types";

/** Unions, not bare strings: the type itself documents the legal values. */
interface TasksState {
  filterOwner: Owner | "All";
  filterStatus: Status | "All";
  filterPriority: Priority | "All";
  setFilterOwner: (owner: Owner | "All") => void;
  setFilterStatus: (status: Status | "All") => void;
  setFilterPriority: (priority: Priority | "All") => void;
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
