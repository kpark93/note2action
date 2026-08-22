// Public sign-in screen — the one route not behind RequireAuth.
// Path: app.tsx (public route "/sign-in") → [this file] → Clerk's <SignIn/>.
import { SignIn } from "@clerk/clerk-react";

/**
 * Full-page sign-in, rendered by the /sign-in route for signed-out visitors.
 * routing="hash" lets Clerk's multi-step flow (password, verification code…)
 * navigate inside its own widget via the URL hash, without needing extra
 * routes from our router. The sign-up link is a plain href to our route.
 */
export function SignInView() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <SignIn routing="hash" signUpUrl="/sign-up" />
    </div>
  );
}
