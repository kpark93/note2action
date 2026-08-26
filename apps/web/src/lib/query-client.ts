// Path: providers.tsx (mounts via QueryClientProvider) and
// extraction.store.ts (invalidates after a §3 capture) → [this file].
import { QueryClient } from "@tanstack/react-query";

// One QueryClient for the app's lifetime, created at module load. Exported
// so non-component code (the store's extraction flow) can invalidate it.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data for 30s before refetching, so remounting a view
      // (e.g. the sidebar health dot) doesn't refire the request each time.
      staleTime: 30_000,
      retry: 1,
    },
  },
});
