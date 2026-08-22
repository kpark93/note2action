// Client-only UI state for the History screen — just the owner filter.
// The completed items themselves are server state, read separately via
// useItemsQuery (domain/items/items.queries.ts), not stored here.
// Path: history.view.tsx → [this file] (leaf zustand store).
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** View-local UI state for the History screen (owner filter). */
interface HistoryState {
  historyOwner: string;
  setHistoryOwner: (owner: string) => void;
}

export const useHistoryStore = create<HistoryState>()(
  devtools(
    (set) => ({
      historyOwner: "All",
      setHistoryOwner: (historyOwner) =>
        set({ historyOwner }, false, "history/setHistoryOwner"),
    }),
    { name: "HistoryStore" },
  ),
);
