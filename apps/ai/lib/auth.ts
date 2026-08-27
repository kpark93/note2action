/** Verifies Clerk session JWTs against the JWKS at CLERK_JWKS_URL — cached
 * keys, local crypto per request. Unset URL = auth disabled (dev/test). */
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface VerifiedUser {
  clerkId: string;
  name: string | null;
}

/** Cached per JWKS URL so key fetches survive across requests. */
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksUrlInUse: string | null = null;

/** Returns the verified identity, or null when the token is missing/forged/
 * expired. Null with auth *enabled* means the caller should 401.
 * Known gap: no rate limiting — verified users can still spend freely. */
export async function verifyRequest(
  req: Request,
): Promise<VerifiedUser | null> {
  const jwksUrl = process.env.CLERK_JWKS_URL;
  if (!jwksUrl) return { clerkId: "dev", name: null };

  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;

  try {
    if (jwksUrlInUse !== jwksUrl) {
      jwks = createRemoteJWKSet(new URL(jwksUrl));
      jwksUrlInUse = jwksUrl;
    }
    const { payload } = await jwtVerify(token, jwks!, {
      algorithms: ["RS256"],
    });
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    const name = typeof payload.name === "string" ? payload.name.trim() : null;
    return { clerkId: payload.sub, name: name || null };
  } catch {
    return null;
  }
}
