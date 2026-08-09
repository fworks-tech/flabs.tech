import { describe, expect, it, vi } from "vitest";

const storeMock = vi.hoisted(() => ({
  incr: vi.fn(async () => 1),
  set: vi.fn(async () => undefined),
  get: vi.fn(async () => null),
}));

vi.mock("@/lib/abuse/store", () => ({ store: storeMock }));

import { POST } from "../route";

const valid = {
  attemptId: "attempt-1",
  answers: [{ questionId: "q1", correct: true, timeMs: 4200 }],
  durationMs: 120_000,
};

function request(body: unknown) {
  return new Request("http://localhost/api/quiz/attempt", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/quiz/attempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.incr.mockResolvedValue(1);
  });

  it("persists a valid attempt with a 7-day TTL", async () => {
    const res = await POST(request(valid));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(storeMock.set).toHaveBeenCalledWith("quiz:attempt:attempt-1", valid, {
      ex: 7 * 24 * 60 * 60,
    });
  });

  it("rejects an invalid attempt", async () => {
    const res = await POST(request({ attemptId: "", answers: [], durationMs: 1 }));
    expect(res.status).toBe(400);
    expect(storeMock.set).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    storeMock.incr.mockResolvedValue(21);
    const res = await POST(request(valid));
    expect(res.status).toBe(429);
  });
});
