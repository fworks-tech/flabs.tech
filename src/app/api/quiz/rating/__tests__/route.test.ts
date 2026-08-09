import { describe, expect, it, vi } from "vitest";

const storeMock = vi.hoisted(() => ({
  incr: vi.fn(async () => 1),
  get: vi.fn(async () => null),
  set: vi.fn(async () => undefined),
}));

vi.mock("@/lib/abuse/store", () => ({ store: storeMock }));

import { POST } from "../route";

function request(body: unknown) {
  return new Request("http://localhost/api/quiz/rating", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/quiz/rating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.incr.mockResolvedValue(1);
  });

  it("increments the up counter for a recommendation", async () => {
    const res = await POST(request({ rating: 1 }));
    expect(res.status).toBe(200);
    expect(storeMock.incr).toHaveBeenCalledWith(
      expect.stringMatching(/^quiz:ratings:\d{4}-\d{2}-\d{2}:up$/),
      expect.any(Number),
    );
  });

  it("increments the down counter and stores the comment", async () => {
    const res = await POST(request({ rating: 0, comment: "too hard" }));
    expect(res.status).toBe(200);
    expect(storeMock.incr).toHaveBeenCalledWith(
      expect.stringMatching(/^quiz:ratings:\d{4}-\d{2}-\d{2}:down$/),
      expect.any(Number),
    );
    const [key, comments] = storeMock.set.mock.calls[0] as unknown[];
    expect(key).toBe("quiz:ratings:comments");
    expect(comments).toEqual(["too hard"]);
  });

  it("rejects invalid ratings without touching the rating counters", async () => {
    const res = await POST(request({ rating: 5 }));
    expect(res.status).toBe(400);
    expect(
      storeMock.incr.mock.calls.every((call: unknown[]) => !String(call[0]).includes(":up")),
    ).toBe(true);
    expect(
      storeMock.incr.mock.calls.every((call: unknown[]) => !String(call[0]).includes(":down")),
    ).toBe(true);
  });

  it("returns 429 when rate limited (3/min)", async () => {
    storeMock.incr.mockResolvedValue(4);
    const res = await POST(request({ rating: 1 }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
  });
});
