/** Public sign-up screen ("/sign-up") — the other route not behind RequireAuth.
 * Renders Clerk's <SignUp/>. */
import { SignUp } from "@clerk/clerk-react";

/** Full-page sign-up — mirror of sign-in.view.tsx; see that file for notes. */
export function SignUpView() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <SignUp routing="hash" signInUrl="/sign-in" />
    </div>
  );
}
