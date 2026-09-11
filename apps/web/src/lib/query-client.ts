/** The app-wide QueryClient, created once at module load; providers.tsx mounts it. */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Freshness comes from invalidation, not the clock; long windows serve pure cache.
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
