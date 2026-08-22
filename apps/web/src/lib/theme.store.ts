// Light/dark theme, kept in a tiny Zustand store. Initial value comes
// from the `.dark` class index.html sets before paint — no flash, no
// double source of truth.
// Path: sidebar.tsx, toaster.tsx → [this file] (leaf, localStorage only).
import { create } from "zustand";

export type Theme = "light" | "dark";

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore (private mode / storage disabled)
  }
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
  setTheme: (theme) => {
    apply(theme);
    set({ theme });
  },
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    apply(next);
    set({ theme: next });
  },
}));
