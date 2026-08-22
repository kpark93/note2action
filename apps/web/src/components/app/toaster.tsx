// The app's error toast outlet. Mounted once in providers.tsx; the optimistic
// mutation hooks (usePatchItem, useDeleteItem, useSaveToTasks in
// items.queries.ts) call sonner's toast.error() on rollback — this component
// is just where those toasts render, not something views import directly.
// Path: providers.tsx (mounts) ← toast.error() from items.queries (domain)
// → [this file] → sonner's <Sonner/>.  (request-paths.md §2)
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/lib/theme.store";

/**
 * App-wide toast outlet (sonner), mounted once in providers. Lives in
 * components/app (not ui/) because it reads the app's theme store — the
 * stock shadcn wrapper assumes next-themes, which this app doesn't use.
 */
export function Toaster(props: ToasterProps) {
  const theme = useTheme((state) => state.theme);
  return <Sonner theme={theme} position="bottom-right" richColors {...props} />;
}
