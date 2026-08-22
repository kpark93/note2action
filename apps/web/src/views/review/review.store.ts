// Client-only UI state for the Review screen — just the "only low
// confidence" toggle. The items themselves are server state, read
// separately via useItemsQuery (domain/items/items.queries.ts).
// Path: review.view.tsx → [this file] (leaf zustand store).
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** View-local UI state for the Review screen. */
interface ReviewState {
  onlyLow: boolean;
  toggleOnlyLow: () => void;
}

export const useReviewStore = create<ReviewState>()(
  devtools(
    (set) => ({
      onlyLow: false,
      toggleOnlyLow: () =>
        set((s) => ({ onlyLow: !s.onlyLow }), false, "review/toggleOnlyLow"),
    }),
    { name: "ReviewStore" },
  ),
);
