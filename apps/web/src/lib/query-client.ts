import { QueryClient } from "@tanstack/react-query";

// One QueryClient for the app's lifetime, created at module load so the query
// cache survives re-renders. Exported so non-component code (the zustand
// store's extraction flow) can invalidate queries after it writes data.
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
