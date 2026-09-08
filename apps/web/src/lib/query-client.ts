/** The app-wide QueryClient, created once at module load; providers.tsx
 * mounts it. */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Freshness here comes from invalidation, not the clock: every write
      // invalidates exactly what it changed, so timers only cover edits from
      // another device. Long windows + no focus refetch = navigation and tab
      // switches serve pure cache.
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
