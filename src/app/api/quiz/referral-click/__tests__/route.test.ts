import { describe, expect, it, vi } from "vitest";

const storeMock = vi.hoisted(() => ({
  incr: vi.fn(async () => 1),
}));

vi.mock("@/lib/abuse/store", () => ({ store: storeMock }));

import { POST } from "../route";

describe("POST /api/quiz/referral-click", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.incr.mockResolvedValue(1);
  });

  it("increments the all-time click counter", async () => {
    const res = await POST(
      new Request("http://localhost/api/quiz/referral-click", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(storeMock.incr).toHaveBeenCalledWith("quiz:referral:clicks");
  });

  it("returns 429 when rate limited", async () => {
    storeMock.incr.mockResolvedValue(11);
    const res = await POST(
      new Request("http://localhost/api/quiz/referral-click", {
        method: "POST",
        headers: { "x-forwarded-for": "1.2.3.4" },
      }),
    );
    expect(res.status).toBe(429);
  });
});
