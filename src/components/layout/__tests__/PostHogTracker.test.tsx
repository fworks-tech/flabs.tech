import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initMock = vi.fn();
const captureMock = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    init: (...args: unknown[]) => initMock(...args),
    capture: (...args: unknown[]) => captureMock(...args),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const CONSENT_COOKIE = "_fa_consent";

function setConsentCookie(value: string | null) {
  document.cookie = value
    ? `${CONSENT_COOKIE}=${value}; path=/`
    : `${CONSENT_COOKIE}=; max-age=0; path=/`;
}

describe("PostHogTracker", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com");
    setConsentCookie(null);
  });

  afterEach(() => {
    setConsentCookie(null);
    vi.unstubAllEnvs();
  });

  it("does not init posthog without consent", async () => {
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    render(<PostHogTracker />);
    expect(initMock).not.toHaveBeenCalled();
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("inits and captures $pageview when consent was already accepted", async () => {
    setConsentCookie("accepted");
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    render(<PostHogTracker />);
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith("$pageview");
  });

  it("inits and captures the current pageview when the banner is accepted later", async () => {
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    const { setConsent } = await import("@/lib/tracking");
    render(<PostHogTracker />);
    expect(initMock).not.toHaveBeenCalled();

    setConsent("accepted");

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith("$pageview");
  });

  it("never inits when consent is declined", async () => {
    setConsentCookie("declined");
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    render(<PostHogTracker />);
    expect(initMock).not.toHaveBeenCalled();
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("inits at most once across remounts", async () => {
    setConsentCookie("accepted");
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    const { unmount: unmount1 } = render(<PostHogTracker />);
    unmount1();
    render(<PostHogTracker />);
    expect(initMock).toHaveBeenCalledTimes(1);
  });
});
