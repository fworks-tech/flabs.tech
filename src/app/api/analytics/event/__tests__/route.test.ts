import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const rateLimitMock = vi.hoisted(() => vi.fn(() => ({ allowed: true, retryAfter: 0 })));
const recordEventMock = vi.hoisted(() => vi.fn(async () => {}));

vi.mock("@/lib/rateLimiter", () => ({
  rateLimit: rateLimitMock,
}));

vi.mock("@/lib/tracking-store", () => ({
  EVENT_TYPES: new Set(["session_start", "page_view", "nav_click", "scroll_depth"]),
  recordEvent: recordEventMock,
}));

beforeEach(() => {
  rateLimitMock.mockClear();
  recordEventMock.mockClear();
  rateLimitMock.mockReturnValue({ allowed: true, retryAfter: 0 });
});

function createRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/analytics/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("analytics event route", () => {
  it("stores a valid batch of events", async () => {
    const { POST } = await import("@/app/api/analytics/event/route");

    const res = await POST(
      createRequest([
        { t: Date.now(), ty: "page_view", uid: "u1", sid: "s1", p: "/blog" },
        { t: Date.now(), ty: "session_start", uid: "u1", sid: "s1" },
      ]),
    );

    expect(res.status).toBe(200);
    expect(recordEventMock).toHaveBeenCalledTimes(2);
    const body = await res.json();
    expect(body).toEqual({ ok: true, stored: 2 });
  });

  it("drops unknown event types and identity-less payloads", async () => {
    const { POST } = await import("@/app/api/analytics/event/route");

    const res = await POST(
      createRequest([
        { t: Date.now(), ty: "hacked", uid: "u1" },
        { t: Date.now(), ty: "page_view" },
        "garbage",
        null,
        { t: Date.now(), ty: "page_view", uid: "u1", sid: "s1" },
      ]),
    );

    expect(res.status).toBe(200);
    expect(recordEventMock).toHaveBeenCalledTimes(1);
  });

  it("rejects non-array bodies", async () => {
    const { POST } = await import("@/app/api/analytics/event/route");

    const res = await POST(createRequest({ ty: "page_view" }));
    expect(res.status).toBe(400);
  });

  it("caps batches at MAX_BATCH events", async () => {
    const { POST } = await import("@/app/api/analytics/event/route");

    const events = Array.from({ length: 40 }, () => ({
      t: Date.now(),
      ty: "page_view",
      uid: "u1",
      sid: "s1",
    }));
    const res = await POST(createRequest(events));

    expect(res.status).toBe(200);
    expect(recordEventMock).toHaveBeenCalledTimes(25);
  });

  it("returns 429 with Retry-After when rate limited", async () => {
    rateLimitMock.mockReturnValue({ allowed: false, retryAfter: 42 });
    const { POST } = await import("@/app/api/analytics/event/route");

    const res = await POST(createRequest([]));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(recordEventMock).not.toHaveBeenCalled();
  });
});
