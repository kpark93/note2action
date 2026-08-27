/** Pins the auth boundary: disabled mode passes a dev identity; enabled mode
 * rejects missing/garbage tokens. Signature checks live in Clerk's JWKS. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyRequest } from "./auth";

function req(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/extract", {
    method: "POST",
    headers,
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("verifyRequest", () => {
  it("returns a dev identity when CLERK_JWKS_URL is unset (auth disabled)", async () => {
    vi.stubEnv("CLERK_JWKS_URL", "");
    await expect(verifyRequest(req())).resolves.toEqual({
      clerkId: "dev",
      name: null,
    });
  });

  it("returns null with auth enabled and no Authorization header", async () => {
    vi.stubEnv(
      "CLERK_JWKS_URL",
      "https://example.clerk.accounts.dev/.well-known/jwks.json",
    );
    await expect(verifyRequest(req())).resolves.toBeNull();
  });

  it("returns null with auth enabled and a garbage token", async () => {
    vi.stubEnv(
      "CLERK_JWKS_URL",
      "https://example.clerk.accounts.dev/.well-known/jwks.json",
    );
    await expect(
      verifyRequest(req({ Authorization: "Bearer not.a.jwt" })),
    ).resolves.toBeNull();
  });
});
