// Unit tests for prompt assembly — generateObject is mocked, so no API
// key and no network. What's pinned: the request's fields all reach the
// prompt, and the model's object comes back unchanged.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({ generateObject: vi.fn() }));
vi.mock("@/lib/provider", () => ({ extractModel: () => "mock-model" }));

import { generateObject } from "ai";
import { extractItems } from "./extraction";

const REQUEST = {
  notes: "Kyle to ship the API by Friday",
  meetingTitle: "Sprint planning",
  today: "2026-08-23",
  owners: ["Kyle", "Priya"],
};

const mocked = vi.mocked(generateObject);

beforeEach(() => {
  mocked.mockReset();
  mocked.mockResolvedValue({ object: { items: [] } } as never);
});

describe("extractItems", () => {
  it("threads every request field into the prompt", async () => {
    await extractItems(REQUEST);

    const call = mocked.mock.calls[0][0] as { prompt: string };
    expect(call.prompt).toContain("2026-08-23");
    expect(call.prompt).toContain('"Sprint planning"');
    expect(call.prompt).toContain("Kyle, Priya");
    expect(call.prompt).toContain(REQUEST.notes);
  });

  it("returns the model's object untouched", async () => {
    const items = [{ title: "Ship the API" }];
    mocked.mockResolvedValue({ object: { items } } as never);

    await expect(extractItems(REQUEST)).resolves.toEqual({ items });
  });
});
