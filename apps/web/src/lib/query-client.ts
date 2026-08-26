/** The app-wide QueryClient, created once at module load — providers.tsx mounts
 * it; extraction.store.ts (non-component code) invalidates it after a capture. */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data for 60s before refetching, so remounting a view
      // (e.g. the sidebar health dot) doesn't refire the request each time.
      staleTime: 60_000,
      retry: 1,
    },
  },
});
