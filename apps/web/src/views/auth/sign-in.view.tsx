/** Public sign-in screen — not behind RequireAuth; renders Clerk's <SignIn/>. */
import { SignIn } from "@clerk/clerk-react";

/** Full-page sign-in; routing="hash" lets Clerk's flow navigate via the URL hash. */
export function SignInView() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <SignIn routing="hash" signUpUrl="/sign-up" />
    </div>
  );
}
