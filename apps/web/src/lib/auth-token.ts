/** Bridge from Clerk to hook-free modules: providers.tsx registers, http.ts reads. */

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
