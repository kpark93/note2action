/** Client-only UI state for History — just the owner filter. The completed
 * items are server state, read via useItemsQuery, not stored here. */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Owner } from "@/domain/items/items.constants";

/** A union, not a bare string: the type itself documents the legal values. */
interface HistoryState {
  historyOwner: Owner | "All";
  setHistoryOwner: (owner: Owner | "All") => void;
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
