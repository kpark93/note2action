import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** View-local UI state for the Tasks screen (owner/status filters). */
interface TasksState {
  filterOwner: string;
  filterStatus: string;
  setFilterOwner: (owner: string) => void;
  setFilterStatus: (status: string) => void;
  clearFilters: () => void;
}

export const useTasksStore = create<TasksState>()(
  devtools(
    (set) => ({
      filterOwner: "All",
      filterStatus: "All",
      setFilterOwner: (filterOwner) =>
        set({ filterOwner }, false, "tasks/setFilterOwner"),
      setFilterStatus: (filterStatus) =>
        set({ filterStatus }, false, "tasks/setFilterStatus"),
      clearFilters: () =>
        set({ filterOwner: "All", filterStatus: "All" }, false, "tasks/clearFilters"),
    }),
    { name: "TasksStore" },
  ),
);
