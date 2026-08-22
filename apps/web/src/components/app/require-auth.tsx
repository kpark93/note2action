// Auth gate wrapping the whole authenticated app. Wraps <AppLayout> in
// app.tsx so every view behind it requires a signed-in Clerk session.
// Path: app.tsx (layout route) → [this file] → AppLayout (app-layout.tsx).
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ClerkLoading, SignedIn, SignedOut } from "@clerk/clerk-react";

/**
 * Route guard for the app shell. Clerk resolves the session asynchronously on
 * page load, so there are three states — loading (show a quiet placeholder,
 * never a redirect: we don't yet know the answer), signed in (render the
 * app), signed out (send to /sign-in).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  return (
    <>
      <ClerkLoading>
        <div className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Checking session…
        </div>
      </ClerkLoading>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}
