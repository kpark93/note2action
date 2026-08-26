/** Shared context providers: Clerk (auth), TanStack Query (server cache), toast
 * host. AuthTokenBridge runs first so lib/http.ts can attach session tokens. */
import { useEffect, type ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/app/toaster";
import { setAuthTokenGetter } from "@/lib/auth-token";
import { queryClient } from "@/lib/query-client";

/** Registers Clerk's getToken with the auth-token bridge so http.ts (no hooks)
 * can attach it to each request. Renders nothing. */
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
  // Read inside the component (not module scope) so importing this file
  // never requires a key; only rendering AppProviders does.
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
        <Toaster />
        {/* Renders nothing in production builds. */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
