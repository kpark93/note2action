/** Bridge between Clerk (React context) and plain modules like http.ts that
 * can't call hooks — providers.tsx registers a token getter, http.ts reads it. */

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
