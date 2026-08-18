import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendBeaconMock = vi.fn();

beforeEach(() => {
  document.cookie = "_fa_consent=; max-age=0; path=/";
  document.cookie = "_fa_uid=; max-age=0; path=/";
  document.cookie = "_fa_sid=; max-age=0; path=/";
  Object.defineProperty(navigator, "sendBeacon", {
    value: sendBeaconMock,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("tracking client", () => {
  it("returns null consent before any choice", async () => {
    const { getConsent } = await import("@/lib/tracking");
    expect(getConsent()).toBeNull();
  });

  it("setConsent persists the cookie and dispatches an event", async () => {
    const { getConsent, setConsent } = await import("@/lib/tracking");
    const listener = vi.fn();
    window.addEventListener("fa:consent", listener);

    setConsent("accepted");

    expect(getConsent()).toBe("accepted");
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: "accepted" }));
  });

  it("ensureIds creates uid and sid cookies", async () => {
    const { ensureIds, getCookie, UID_COOKIE, SID_COOKIE } = await import("@/lib/tracking");

    const ids = ensureIds();
    expect(ids.uid).toMatch(/^[0-9a-f-]{36}$/);
    expect(ids.sid).toMatch(/^[0-9a-f-]{36}$/);
    expect(getCookie(UID_COOKIE)).toBe(ids.uid);
    expect(getCookie(SID_COOKIE)).toBe(ids.sid);
  });

  it("tracks by default before any consent choice", async () => {
    const { track } = await import("@/lib/tracking");

    for (let i = 0; i < 10; i++) track("page_view");

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
  });

  it("track() sends nothing after consent is declined", async () => {
    const { setConsent, track } = await import("@/lib/tracking");

    setConsent("declined");
    for (let i = 0; i < 12; i++) track("page_view");

    expect(sendBeaconMock).not.toHaveBeenCalled();
  });

  it("track() flushes via sendBeacon after 10 buffered events", async () => {
    const { track } = await import("@/lib/tracking");

    for (let i = 0; i < 10; i++) track("page_view");

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(sendBeaconMock).toHaveBeenCalledWith(
      "/api/analytics/event",
      expect.any(Blob),
    );
  });

  it("clearConsent resets the decision and dispatches an event", async () => {
    const { clearConsent, getConsent, setConsent } = await import("@/lib/tracking");
    const listener = vi.fn();
    window.addEventListener("fa:consent", listener);

    setConsent("declined");
    clearConsent();

    expect(getConsent()).toBeNull();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: null }));
  });

  it("emits consent_declined even while consent is declined (force bypass)", async () => {
    const { initTracking, setConsent, track } = await import("@/lib/tracking");

    initTracking();
    setConsent("declined");
    track("consent_declined", undefined, { force: true });
    window.dispatchEvent(new Event("pagehide"));

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    const blob = sendBeaconMock.mock.calls[0][1] as Blob;
    const events = JSON.parse(await blob.text()) as Array<{ ty: string; p: string }>;
    expect(events).toHaveLength(1);
    expect(events[0].ty).toBe("consent_declined");
  });

  it("flush() on pagehide sends buffered events", async () => {
    const { initTracking, setConsent, track } = await import("@/lib/tracking");

    initTracking();
    setConsent("accepted");
    track("nav_click");

    window.dispatchEvent(new Event("pagehide"));

    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
  });

  it("startTrackingSession emits session_start and page_view by default", async () => {
    const { startTrackingSession } = await import("@/lib/tracking");

    startTrackingSession();

    // 2 buffered events — flush via pagehide to inspect.
    window.dispatchEvent(new Event("pagehide"));

    const call = sendBeaconMock.mock.calls[0];
    const blob = call[1] as Blob;
    const text = await blob.text();
    const events = JSON.parse(text) as Array<{ ty: string }>;

    expect(events).toHaveLength(2);
    expect(events.map((e) => e.ty)).toEqual(["session_start", "page_view"]);
  });
});
