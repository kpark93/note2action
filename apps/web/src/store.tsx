import { create } from "zustand";

interface UIState {
  selectedItemId: string | null;
  select: (id: string) => void;
}
export const useUIStore = create<UIState>((set) => ({
  selectedItemId: null,
  select: (id) => set({ selectedItemId: id }),
}));