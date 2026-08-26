/** Auth gate wrapping the whole authenticated app — app.tsx puts <AppLayout>
 * behind it, so every view requires a signed-in Clerk session. */
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ClerkLoading, SignedIn, SignedOut } from "@clerk/clerk-react";

/** Shows a placeholder while Clerk loads, then renders children (signed in) or
 * redirects to /sign-in (signed out). */
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
