// Bridge between Clerk (which lives in React context) and plain modules like
// http.ts (which don't render and can't call hooks). Providers register a
// token getter at startup; http.ts asks for a token before each request.
//
// When no getter is registered (unit tests, or a signed-out instant during
// startup) requests simply go out without an Authorization header — the API
// is the one that decides whether that's acceptable.

type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter | null = null;

/** Called once by providers.tsx when Clerk is available (null to unregister). */
export function setAuthTokenGetter(fn: TokenGetter | null) {
  getter = fn;
}

/** Current session token, or null when signed out / no getter registered. */
export async function getAuthToken(): Promise<string | null> {
  return getter ? await getter() : null;
}
