// The app's error toast outlet. Mounted once in providers.tsx; the
// optimistic mutation hooks (items.queries.ts) call toast.error() on
// rollback here — not something views import directly.
// Path: providers.tsx → [this file] → <Sonner/> (request-paths.md §2).
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/lib/theme.store";

/**
 * App-wide toast outlet (sonner). Lives in components/app (not ui/)
 * because it reads the theme store — shadcn's wrapper assumes next-themes.
 */
export function Toaster(props: ToasterProps) {
  const theme = useTheme((state) => state.theme);
  return <Sonner theme={theme} position="bottom-right" richColors {...props} />;
}
