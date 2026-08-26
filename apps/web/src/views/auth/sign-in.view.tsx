// Public sign-in screen — the one route not behind RequireAuth.
// Path: app.tsx (public route "/sign-in") → [this file] → Clerk's <SignIn/>.
import { SignIn } from "@clerk/clerk-react";

/**
 * Full-page sign-in for signed-out visitors. routing="hash" lets Clerk's
 * multi-step flow navigate its own widget via the URL hash, no extra routes.
 */
export function SignInView() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <SignIn routing="hash" signUpUrl="/sign-up" />
    </div>
  );
}
