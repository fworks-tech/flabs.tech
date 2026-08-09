import { describe, expect, it, vi } from "vitest";

const storeMock = vi.hoisted(() => ({
  incr: vi.fn(async () => 1),
  zadd: vi.fn(async () => undefined),
  zremrangebyrank: vi.fn(async () => 0),
  set: vi.fn(async () => undefined),
  zrevrank: vi.fn(async () => 0),
}));

vi.mock("@/lib/abuse/store", () => ({ store: storeMock }));

import { POST } from "../route";

const validBody = {
  displayName: "Zara",
  score: 3400,
  correct: 17,
  total: 20,
  maxStreak: 9,
  durationMs: 180_000,
};

function request(body: unknown) {
  return new Request("http://localhost/api/quiz/score", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/quiz/score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.incr.mockResolvedValue(1);
    storeMock.zrevrank.mockResolvedValue(0);
  });

  it("saves a valid score to both leaderboards and returns rank", async () => {
    const res = await POST(request(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.id).toBeTypeOf("string");
    expect(data.rank).toBe(0);

    expect(storeMock.zadd).toHaveBeenCalledWith(
      "quiz:leaderboard",
      3400,
      expect.stringContaining("Zara"),
    );
    expect(storeMock.zadd).toHaveBeenCalledWith(
      expect.stringMatching(/^quiz:leaderboard:\d{4}-W\d{2}$/),
      3400,
      expect.any(String),
      expect.any(Number),
    );
    expect(storeMock.zremrangebyrank).toHaveBeenCalledWith("quiz:leaderboard", 100, -1);
    expect(storeMock.set).toHaveBeenCalledWith(
      `quiz:attempt:${data.id}`,
      validBody,
      { ex: 7 * 24 * 60 * 60 },
    );
    expect(storeMock.zrevrank).toHaveBeenCalledWith("quiz:leaderboard", expect.any(String));
  });

  it("rejects invalid JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/quiz/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not json",
      }),
    );
    expect(res.status).toBe(400);
    expect(storeMock.zadd).not.toHaveBeenCalled();
  });

  it.each([
    ["empty name", { ...validBody, displayName: "  " }],
    ["negative score", { ...validBody, score: -5 }],
    ["oversized score", { ...validBody, score: 10_001 }],
    ["impossible correct", { ...validBody, correct: 21 }],
    ["duration below floor", { ...validBody, durationMs: 5000 }],
  ])("rejects %s", async (_label, body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect(storeMock.zadd).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when rate limited", async () => {
    storeMock.incr.mockResolvedValue(11);
    const res = await POST(request(validBody));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(storeMock.zadd).not.toHaveBeenCalled();
  });

  it("rate limits per IP using the durable counter", async () => {
    await POST(request(validBody));
    expect(storeMock.incr).toHaveBeenCalledWith("quiz:rl:score:1.2.3.4", 60);
  });
});
