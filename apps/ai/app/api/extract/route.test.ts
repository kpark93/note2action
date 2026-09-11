/** /api/extract border: no auth → 401, valid body → extractItems, malformed → 400. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/extraction", () => ({
  extractItems: vi.fn().mockResolvedValue({ items: [] }),
}));
vi.mock("@/lib/auth", () => ({ verifyRequest: vi.fn() }));

import { extractItems } from "@/lib/extraction";
import { verifyRequest } from "@/lib/auth";
import { POST } from "./route";

const mockedAuth = vi.mocked(verifyRequest);

beforeEach(() => {
  mockedAuth.mockResolvedValue({ clerkId: "user_1", name: null });
});

const VALID = {
  notes: "Ship it",
  meetingTitle: "Standup",
  today: "2026-08-23",
};

function post(body: unknown): Request {
  return new Request("http://localhost/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/extract", () => {
  it("rejects an unverified request as 401 before reading the body", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await POST(post(VALID));

    expect(response.status).toBe(401);
    expect(extractItems).not.toHaveBeenCalled();
  });

  it("passes a valid body through to extractItems", async () => {
    const response = await POST(post(VALID));

    expect(response.status).toBe(200);
    expect(extractItems).toHaveBeenCalledWith(VALID);
  });

  it("rejects a body with missing fields as 400", async () => {
    const response = await POST(post({ notes: "no other fields" }));

    expect(response.status).toBe(400);
  });

  it("rejects unparseable JSON as 400, not a crash", async () => {
    const response = await POST(post("{not json"));

    expect(response.status).toBe(400);
  });

  it("maps an extraction failure to 502, not an unhandled crash", async () => {
    vi.mocked(extractItems).mockRejectedValueOnce(new Error("provider down"));

    const response = await POST(post(VALID));

    expect(response.status).toBe(502);
  });
});
