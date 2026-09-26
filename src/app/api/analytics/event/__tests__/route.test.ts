import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const rateLimitMock = vi.hoisted(() => vi.fn(() => ({ allowed: true, retryAfter: 0 })));
const recordEventMock = vi.hoisted(() => vi.fn(async () => {}));
const loggerMock = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock("@/lib/rateLimiter", () => ({
  rateLimit: rateLimitMock,
}));

vi.mock("@/lib/logger", () => ({ logger: loggerMock }));

vi.mock("@/lib/tracking-store", () => ({
  EVENT_TYPES_SET: new Set([
    "session_start",
    "page_view",
    "nav_click",
    "cta_click",
    "scroll_depth",
    "ai_assistant_generation_stopped",
    "protected_route_access_granted",
  ]),
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

  it("accepts event types that were previously dropped", async () => {
    const { POST } = await import("@/app/api/analytics/event/route");

    const res = await POST(
      createRequest([
        { t: Date.now(), ty: "ai_assistant_generation_stopped", uid: "u1", sid: "s1" },
        { t: Date.now(), ty: "protected_route_access_granted", uid: "u1", sid: "s1" },
      ]),
    );

    expect(res.status).toBe(200);
    expect(recordEventMock).toHaveBeenCalledTimes(2);
  });

  it("keeps the cta label and rejects an over-long one", async () => {
    const { POST } = await import("@/app/api/analytics/event/route");

    const res = await POST(
      createRequest([
        { t: Date.now(), ty: "cta_click", uid: "u1", sid: "s1", l: "View Projects" },
        { t: Date.now(), ty: "cta_click", uid: "u1", sid: "s1", l: "x".repeat(500) },
      ]),
    );

    expect(res.status).toBe(200);
    const first = recordEventMock.mock.calls[0][0];
    const second = recordEventMock.mock.calls[1][0];
    expect(first.l).toBe("View Projects");
    expect(second.l).toHaveLength(200);
  });

  it("does not write the client ip to the log stream", async () => {
    const { POST } = await import("@/app/api/analytics/event/route");
    const warn = vi.spyOn(loggerMock, "warn");

    const req = new NextRequest("http://localhost:3000/api/analytics/event", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.7, 70.41.3.18",
      },
      body: JSON.stringify("not-json"),
    });
    await POST(req);

    expect(warn).toHaveBeenCalled();
    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).not.toContain("203.0.113.7");
    expect(logged).not.toContain("70.41.3.18");
    warn.mockRestore();
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
