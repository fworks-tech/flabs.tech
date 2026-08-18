import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const track = vi.fn();
const capture = vi.fn();
const selfHostedTrack = vi.fn();

vi.mock("@vercel/analytics", () => ({ track }));
vi.mock("posthog-js", () => ({ default: { capture: (...args: unknown[]) => capture(...args) } }));
vi.mock("@/lib/tracking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tracking")>();
  return { ...actual, track: selfHostedTrack };
});

const CONSENT_COOKIE = "_fa_consent";

function setConsentCookie(value: string | null) {
  document.cookie = value
    ? `${CONSENT_COOKIE}=${value}; path=/`
    : `${CONSENT_COOKIE}=; max-age=0; path=/`;
}

describe("analytics", () => {
  beforeAll(() => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
  });

  afterEach(() => {
    vi.clearAllMocks();
    setConsentCookie(null);
  });

  it("calls track with event name and properties", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("cta_click", { label: "View Projects" });
    expect(track).toHaveBeenCalledWith("cta_click", { label: "View Projects" });
  });

  it("calls track with only event name", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("nav_click");
    expect(track).toHaveBeenCalledWith("nav_click", undefined);
  });

  it("captures to posthog by default without consent", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("cta_click", { label: "View Projects" });
    expect(capture).toHaveBeenCalledWith("cta_click", { label: "View Projects" });
  });

  it("does not capture to posthog when consent is declined", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    setConsentCookie("declined");
    trackEvent("cta_click", { label: "View Projects" });
    expect(capture).not.toHaveBeenCalled();
  });

  it("does not capture to posthog when consent is missing", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    setConsentCookie(null);
    trackEvent("cta_click", { label: "View Projects" });
    expect(capture).toHaveBeenCalledWith("cta_click", { label: "View Projects" });
  });

  it("does not throw in server environment", async () => {
    const spy = vi.spyOn(globalThis, "window", "get").mockReturnValue(undefined as unknown as Window & typeof globalThis);
    const { trackEvent } = await import("@/lib/analytics");
    expect(() => trackEvent("cta_click")).not.toThrow();
    expect(track).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("passes path and value through to the self-hosted tracker", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("cta_click", { label: "View Projects", path: "/projects", value: 1 });

    expect(selfHostedTrack).toHaveBeenCalledWith("cta_click", { path: "/projects", value: 1 });
  });
});
