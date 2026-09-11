/** Client-only Tasks UI state (the filter dropdowns); tasks are server state. */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Priority, Status } from "@/domain/items/items.types";

/** Unions, not bare strings: the type itself documents the legal values. */
interface TasksState {
  filterStatus: Status | "All";
  filterPriority: Priority | "All";
  setFilterStatus: (status: Status | "All") => void;
  setFilterPriority: (priority: Priority | "All") => void;
  clearFilters: () => void;
}

export const useTasksStore = create<TasksState>()(
  devtools(
    (set) => ({
      filterStatus: "All",
      filterPriority: "All",
      setFilterStatus: (filterStatus) =>
        set({ filterStatus }, false, "tasks/setFilterStatus"),
      setFilterPriority: (filterPriority) =>
        set({ filterPriority }, false, "tasks/setFilterPriority"),
      clearFilters: () =>
        set(
          { filterStatus: "All", filterPriority: "All" },
          false,
          "tasks/clearFilters",
        ),
    }),
    { name: "TasksStore" },
  ),
);
