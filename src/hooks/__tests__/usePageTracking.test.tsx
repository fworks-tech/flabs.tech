import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_COOKIE } from "@/lib/tracking";

const startSessionMock = vi.fn();
const trackMock = vi.fn();
const trackEventMock = vi.fn();

vi.mock("@/lib/tracking", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tracking")>();
  return {
    ...actual,
    track: (...args: unknown[]) => trackMock(...args),
    startTrackingSession: (...args: unknown[]) => startSessionMock(...args),
  };
});

vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

let currentPath = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPath,
}));

function clearConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=; max-age=0; path=/`;
}

async function trackSessionStart() {
  const { setConsent } = await import("@/lib/tracking");

  async function emitConsent(state: "accepted" | "declined") {
    await act(async () => {
      setConsent(state);
    });
  }

  return { emitConsent };
}

function clickAnchor(html: string) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;
  const link = wrapper.querySelector("a");
  expect(link).not.toBeNull();
  document.body.appendChild(wrapper);
  link!.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  return wrapper;
}

describe("usePageTracking", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    currentPath = "/";
    clearConsentCookie();
  });

  afterEach(() => {
    clearConsentCookie();
  });

  it("emits exactly one session start despite a later consent-accepted event", async () => {
    const { usePageTracking } = await import("@/hooks/usePageTracking");
    const { emitConsent } = await trackSessionStart();

    renderHook(() => usePageTracking());

    expect(startSessionMock).toHaveBeenCalledTimes(1);

    // Auto-dismissed banner ("accept") must not restart the session.
    await emitConsent("accepted");

    expect(startSessionMock).toHaveBeenCalledTimes(1);
  });

  it("restarts the session after decline then re-enable", async () => {
    const { usePageTracking } = await import("@/hooks/usePageTracking");
    const { emitConsent } = await trackSessionStart();

    renderHook(() => usePageTracking());
    expect(startSessionMock).toHaveBeenCalledTimes(1);

    await emitConsent("declined");
    await emitConsent("accepted");

    expect(startSessionMock).toHaveBeenCalledTimes(2);
  });

  it("skips the initial page_view (handled by session start) and tracks route changes once", async () => {
    const { usePageTracking } = await import("@/hooks/usePageTracking");
    const { rerender } = renderHook(() => usePageTracking());

    expect(trackMock).not.toHaveBeenCalledWith("page_view", expect.anything());

    currentPath = "/about";
    rerender();

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("page_view", { path: "/about" });
  });

  it("classifies an internal link as nav_click exactly once", async () => {
    const { usePageTracking } = await import("@/hooks/usePageTracking");
    renderHook(() => usePageTracking());

    const wrapper = clickAnchor('<a href="/about">About</a>');
    try {
      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith("nav_click", { path: "/about" });
    } finally {
      wrapper.remove();
    }
  });

  it("classifies an external link as external_link exactly once", async () => {
    const { usePageTracking } = await import("@/hooks/usePageTracking");
    renderHook(() => usePageTracking());

    const wrapper = clickAnchor('<a href="https://github.com/user">GitHub</a>');
    try {
      expect(trackMock).toHaveBeenCalledTimes(1);
      expect(trackMock).toHaveBeenCalledWith("external_link", { path: "https://github.com/user" });
      expect(trackEventMock).not.toHaveBeenCalled();
    } finally {
      wrapper.remove();
    }
  });

  it("uses data-track-event to override the classification once", async () => {
    const { usePageTracking } = await import("@/hooks/usePageTracking");
    renderHook(() => usePageTracking());

    const wrapper = clickAnchor(
      '<a href="/projects" data-track-event="cta_click" data-track-label="View Projects">View Projects</a>',
    );
    try {
      expect(trackEventMock).toHaveBeenCalledTimes(1);
      expect(trackEventMock).toHaveBeenCalledWith("cta_click", {
        path: "/projects",
        label: "View Projects",
      });
    } finally {
      wrapper.remove();
    }
  });

  it("does not track clicks once consent is declined", async () => {
    const { usePageTracking } = await import("@/hooks/usePageTracking");
    const { emitConsent } = await trackSessionStart();
    renderHook(() => usePageTracking());

    await emitConsent("declined");
    const wrapper = clickAnchor('<a href="/about">About</a>');

    expect(trackEventMock).not.toHaveBeenCalled();
    wrapper.remove();
  });
});