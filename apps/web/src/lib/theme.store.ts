/** Light/dark theme in a tiny Zustand store; the initial value reads the `.dark`
 * class index.html sets before paint — no flash, no double source of truth. */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type Theme = "light" | "dark";

/** Flips the `.dark` class on <html> and persists the choice to localStorage. */
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
}

export const useTheme = create<ThemeState>()(
  devtools(
    (set) => ({
      theme: document.documentElement.classList.contains("dark")
        ? "dark"
        : "light",
      setTheme: (theme) => {
        apply(theme);
        set({ theme }, false, "theme/setTheme");
      },
    }),
    { name: "ThemeStore" },
  ),
);
