/** Verifies Clerk JWTs against CLERK_JWKS_URL; unset URL: auth off in dev, 401 in prod. */
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface VerifiedUser {
  clerkId: string;
  name: string | null;
}

/** Cached per JWKS URL so key fetches survive across requests. */
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksUrlInUse: string | null = null;

/** Verified identity, or null (→ 401 when auth is enabled). No rate limiting yet. */
export async function verifyRequest(
  req: Request,
): Promise<VerifiedUser | null> {
  const jwksUrl = process.env.CLERK_JWKS_URL;
  if (!jwksUrl) {
    // A missing URL must never open the endpoint in production — fail closed.
    if (process.env.NODE_ENV === "production") return null;
    return { clerkId: "dev", name: null };
  }

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
