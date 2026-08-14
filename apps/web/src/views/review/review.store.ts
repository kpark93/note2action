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
