import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// One QueryClient for the app's lifetime, created at module load so the query
// cache survives re-renders.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Serve cached data for 30s before refetching, so remounting a view
      // (e.g. the sidebar health dot) doesn't refire the request each time.
      staleTime: 30_000,
      retry: 1,
    },
  },
});

/** Wraps the app in shared context providers (currently TanStack Query). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
