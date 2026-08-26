/** Public sign-in screen ("/sign-in") — one of the two routes not behind
 * RequireAuth. Renders Clerk's <SignIn/>. */
import { SignIn } from "@clerk/clerk-react";

/** Full-page sign-in; routing="hash" lets Clerk's multi-step flow navigate its
 * own widget via the URL hash, no extra routes. */
export function SignInView() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <SignIn routing="hash" signUpUrl="/sign-up" />
    </div>
  );
}
