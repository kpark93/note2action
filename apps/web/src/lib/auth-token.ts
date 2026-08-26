// Bridge between Clerk (React context) and plain modules like http.ts,
// which can't call hooks. Providers register a token getter at startup;
// http.ts asks for one before each request (no getter → no header).
// Path: providers.tsx (registers) → [this file] ← lib/http.ts (reads it).

type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter | null = null;

/** Registers the token getter (pass null to unregister). */
export function setAuthTokenGetter(fn: TokenGetter | null) {
  getter = fn;
}

/** Current session token, or null if signed out / no getter set. */
export async function getAuthToken(): Promise<string | null> {
  return getter ? await getter() : null;
}
