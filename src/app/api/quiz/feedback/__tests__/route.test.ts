import { describe, expect, it, vi } from "vitest";

const storeMock = vi.hoisted(() => ({
  incr: vi.fn(async () => 1),
  get: vi.fn(async () => null),
  set: vi.fn(async () => undefined),
}));

vi.mock("@/lib/abuse/store", () => ({ store: storeMock }));

import { POST } from "../route";

function request(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/quiz/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/quiz/feedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.incr.mockResolvedValue(1);
  });

  it("stores valid feedback with generated ids", async () => {
    const res = await POST(request({ questionId: "event-loop-order", reason: "typo", message: "x" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const [key, list, opts] = storeMock.set.mock.calls[0] as unknown[];
    expect(key).toBe("quiz:feedback");
    expect(list).toMatchObject([
      { questionId: "event-loop-order", reason: "typo", message: "x" },
    ]);
    expect(opts).toEqual({ ex: 30 * 24 * 60 * 60 });
  });

  it("rejects invalid JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/quiz/feedback", {
        method: "POST",
        body: "{bad",
      }),
    );
    expect(res.status).toBe(400);
  });

  it.each([
    ["unknown reason", { questionId: "q1", reason: "nope" }],
    ["missing question", { reason: "typo" }],
    ["non-object", "hello"],
  ])("rejects %s", async (_label, body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect(storeMock.set).not.toHaveBeenCalled();
  });

  it("returns 429 with Retry-After when rate limited", async () => {
    storeMock.incr.mockResolvedValue(11);
    const res = await POST(request({ questionId: "q1", reason: "typo" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(storeMock.set).not.toHaveBeenCalled();
  });

  it("rate limits per IP via the durable counter", async () => {
    await POST(request({ questionId: "q1", reason: "typo" }, "9.9.9.9"));
    expect(storeMock.incr).toHaveBeenCalledWith("quiz:rl:fb:9.9.9.9", 60);
  });
});
