/** Tests the /api/chat HTTP border: unauthenticated → 401, bodies that aren't
 * a UIMessage list → 400 — bringing chat up to extract's validation standard. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  convertToModelMessages: vi.fn().mockResolvedValue([]),
  safeValidateUIMessages: vi.fn(),
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: () => new Response("stream", { status: 200 }),
  })),
}));
vi.mock("@/lib/auth", () => ({ verifyRequest: vi.fn() }));
vi.mock("@/lib/provider", () => ({ chatModel: () => "mock-model" }));

import { safeValidateUIMessages } from "ai";
import { verifyRequest } from "@/lib/auth";
import { POST } from "./route";

const mockedAuth = vi.mocked(verifyRequest);
const mockedValidate = vi.mocked(safeValidateUIMessages);

function post(body: unknown): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const MESSAGES = [
  { id: "1", role: "user", parts: [{ type: "text", text: "hi" }] },
];

beforeEach(() => {
  mockedAuth.mockResolvedValue({ clerkId: "user_1", name: null });
  mockedValidate.mockResolvedValue({
    success: true,
    data: MESSAGES,
  } as never);
});

describe("POST /api/chat", () => {
  it("rejects an unverified request as 401", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await POST(post({ messages: MESSAGES }));

    expect(response.status).toBe(401);
  });

  it("rejects unparseable JSON as 400, not a crash", async () => {
    const response = await POST(post("{not json"));

    expect(response.status).toBe(400);
  });

  it("rejects a body without a messages array as 400", async () => {
    const response = await POST(post({ nope: true }));

    expect(response.status).toBe(400);
  });

  it("rejects messages that fail UIMessage validation as 400", async () => {
    mockedValidate.mockResolvedValue({ success: false } as never);

    const response = await POST(post({ messages: [{ bad: "shape" }] }));

    expect(response.status).toBe(400);
  });

  it("streams for a valid, authenticated request", async () => {
    const response = await POST(post({ messages: MESSAGES }));

    expect(response.status).toBe(200);
  });
});
