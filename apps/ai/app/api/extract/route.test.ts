/** Tests the /api/extract HTTP border: valid bodies reach extractItems (mocked),
 * malformed ones get a 400 — never a 500. */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/extraction", () => ({
  extractItems: vi.fn().mockResolvedValue({ items: [] }),
}));

import { extractItems } from "@/lib/extraction";
import { POST } from "./route";

const VALID = {
  notes: "Ship it",
  meetingTitle: "Standup",
  today: "2026-08-23",
  owners: ["Kyle"],
};

function post(body: unknown): Request {
  return new Request("http://localhost/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/extract", () => {
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
});
