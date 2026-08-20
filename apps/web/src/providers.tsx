import { useEffect, type ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { setAuthTokenGetter } from "@/lib/auth-token";

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

/**
 * Registers Clerk's getToken with the auth-token bridge so http.ts (a plain
 * module, no hooks) can attach the session token to every API request.
 * Renders nothing; must live inside <ClerkProvider>.
 */
function AuthTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}

/** Wraps the app in shared context providers (Clerk auth + TanStack Query). */
export function AppProviders({ children }: { children: ReactNode }) {
  // Read inside the component (not module scope) so importing this file for
  // `queryClient` — as tests and the zustand store do — never requires a key.
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="flex h-screen items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Missing VITE_CLERK_PUBLISHABLE_KEY — copy apps/web/.env.example to
        apps/web/.env, paste your Clerk publishable key, and restart the dev
        server.
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      // Where Clerk sends the browser after auth events; our router owns
      // these paths (see App.tsx).
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/sign-in"
    >
      <AuthTokenBridge />
      <QueryClientProvider client={queryClient}>
        {children}
        {/* Renders nothing in production builds. */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
