import { describe, expect, it, vi } from "vitest";

const storeMock = vi.hoisted(() => ({
  keys: vi.fn(async () => []),
  get: vi.fn(async () => null),
}));

vi.mock("@/lib/abuse/store", () => ({ store: storeMock }));

import { GET } from "../route";

describe("GET /api/quiz/ratings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates up/down counters across day keys", async () => {
    storeMock.keys.mockResolvedValue([
      "quiz:ratings:2026-08-01:up",
      "quiz:ratings:2026-08-02:up",
      "quiz:ratings:2026-08-02:down",
    ]);
    storeMock.get.mockImplementation(async (key: string) => {
      if (key.endsWith(":up")) return 3;
      if (key.endsWith(":down")) return 1;
      return null;
    });
    const res = await GET();
    const data = await res.json();
    expect(data).toEqual({ ratings: { up: 6, down: 1 } });
  });

  it("returns null ratings when the store is unreachable", async () => {
    storeMock.keys.mockRejectedValue(new Error("redis down"));
    const res = await GET();
    const data = await res.json();
    expect(data).toEqual({ ratings: null });
  });
});
