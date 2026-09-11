/** Auth gate: every view behind it requires a signed-in Clerk session. */
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ClerkLoading, SignedIn, SignedOut } from "@clerk/clerk-react";

/** Placeholder while Clerk loads; then children (signed in) or /sign-in redirect. */
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
