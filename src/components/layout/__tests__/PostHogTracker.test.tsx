import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initMock = vi.fn();
const captureMock = vi.fn();
const optOutMock = vi.fn();
const optInMock = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    init: (...args: unknown[]) => initMock(...args),
    capture: (...args: unknown[]) => captureMock(...args),
    opt_out_capturing: (...args: unknown[]) => optOutMock(...args),
    opt_in_capturing: (...args: unknown[]) => optInMock(...args),
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
  beforeEach(() => {
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

  it("inits and captures $pageview by default without consent", async () => {
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    render(<PostHogTracker />);
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith("$pageview");
  });

  it("inits and captures $pageview when consent was already accepted", async () => {
    setConsentCookie("accepted");
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    render(<PostHogTracker />);
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith("$pageview");
  });

  it("captures the current pageview when consent is re-enabled later", async () => {
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    const { setConsent } = await import("@/lib/tracking");
    render(<PostHogTracker />);
    captureMock.mockClear();

    setConsent("accepted");

    expect(captureMock).toHaveBeenCalledWith("$pageview");
  });

  it("never inits when consent is declined", async () => {
    setConsentCookie("declined");
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    render(<PostHogTracker />);
    expect(initMock).not.toHaveBeenCalled();
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("opts out of captures when consent is declined after init", async () => {
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    const { setConsent } = await import("@/lib/tracking");
    render(<PostHogTracker />);
    expect(initMock).toHaveBeenCalledTimes(1);

    setConsent("declined");

    expect(optOutMock).toHaveBeenCalled();
  });

  it("re-opts in to captures when consent is re-accepted after a decline", async () => {
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    const { setConsent } = await import("@/lib/tracking");
    render(<PostHogTracker />);
    expect(initMock).toHaveBeenCalledTimes(1);

    setConsent("declined");
    expect(optOutMock).toHaveBeenCalledTimes(1);

    setConsent("accepted");

    expect(optInMock).toHaveBeenCalledTimes(1);
    expect(captureMock).toHaveBeenCalledWith("$pageview");
  });

  it("inits at most once across remounts", async () => {
    setConsentCookie("accepted");
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    const { unmount: unmount1 } = render(<PostHogTracker />);
    unmount1();
    render(<PostHogTracker />);
    expect(initMock).toHaveBeenCalledTimes(1);
  });

  it("does not init or capture when keys are not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const { default: PostHogTracker } = await import("@/components/layout/PostHogTracker");
    const { setConsent } = await import("@/lib/tracking");
    render(<PostHogTracker />);
    expect(initMock).not.toHaveBeenCalled();
    expect(captureMock).not.toHaveBeenCalled();

    setConsent("accepted");

    expect(initMock).not.toHaveBeenCalled();
    expect(captureMock).not.toHaveBeenCalled();
  });
});