import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// One QueryClient for the app's lifetime, created at module load so the query
// cache survives re-renders.
const queryClient = new QueryClient();

/** Wraps the app in shared context providers (currently TanStack Query). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
