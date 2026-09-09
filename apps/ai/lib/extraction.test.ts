/** Tests prompt assembly with `generateText` mocked (no key, no network):
 * every request field reaches the prompt; the model's output returns unchanged. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  generateText: vi.fn(),
  Output: { object: (spec: unknown) => spec },
}));
vi.mock("@/lib/provider", () => ({ extractModel: () => "mock-model" }));

import { generateText } from "ai";
import { extractItems } from "./extraction";

const REQUEST = {
  notes: "Kyle to ship the API by Friday",
  meetingTitle: "Sprint planning",
  today: "2026-08-23",
};

const mocked = vi.mocked(generateText);

beforeEach(() => {
  mocked.mockReset();
  mocked.mockResolvedValue({ output: { items: [] } } as never);
});

describe("extractItems", () => {
  it("threads every request field into the prompt", async () => {
    await extractItems(REQUEST);

    const call = mocked.mock.calls[0][0] as { prompt: string };
    expect(call.prompt).toContain("2026-08-23");
    expect(call.prompt).toContain('"Sprint planning"');
    // Owners are inferred from the notes now — no roster in the prompt.
    expect(call.prompt).not.toContain("Known owners");
    expect(call.prompt).toContain("exactly as the notes name them");
    expect(call.prompt).toContain(REQUEST.notes);
  });

  it("caps the model's output tokens", async () => {
    await extractItems(REQUEST);

    const call = mocked.mock.calls[0][0] as { maxOutputTokens?: number };
    expect(call.maxOutputTokens).toBe(4096);
  });

  it("returns the model's output untouched", async () => {
    const items = [{ title: "Ship the API" }];
    mocked.mockResolvedValue({ output: { items } } as never);

    await expect(extractItems(REQUEST)).resolves.toEqual({ items });
  });
});
