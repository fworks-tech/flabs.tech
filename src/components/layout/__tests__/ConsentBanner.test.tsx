import { MantineProvider } from "@mantine/core";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_COOKIE } from "@/lib/tracking";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

function clearConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=; max-age=0; path=/`;
}

function setConsentCookie(value: string) {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/`;
}

import { ConsentBanner } from "@/components/layout/ConsentBanner";

describe("ConsentBanner", () => {
  beforeEach(() => {
    clearConsentCookie();
  });

  afterEach(() => {
    clearConsentCookie();
    vi.useRealTimers();
  });

  it("shows the banner when no consent cookie exists", () => {
    render(<ConsentBanner initialConsent={null} />, { wrapper: Wrapper });
    expect(screen.getByTestId("consent-banner")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("stays hidden when consent was already accepted", () => {
    setConsentCookie("accepted");
    render(<ConsentBanner initialConsent="accepted" />, { wrapper: Wrapper });
    expect(screen.queryByTestId("consent-banner")).not.toBeInTheDocument();
  });

  it("stays hidden when consent was declined", () => {
    setConsentCookie("declined");
    render(<ConsentBanner initialConsent="declined" />, { wrapper: Wrapper });
    expect(screen.queryByTestId("consent-banner")).not.toBeInTheDocument();
  });

  it("auto-dismisses after the window and persists accepted", () => {
    vi.useFakeTimers();
    render(<ConsentBanner initialConsent={null} />, { wrapper: Wrapper });
    expect(screen.getByTestId("consent-banner")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(document.cookie).toContain(`${CONSENT_COOKIE}=accepted`);
    expect(screen.queryByTestId("consent-banner")).not.toBeInTheDocument();
  });

  it("does not auto-dismiss before the window elapses", () => {
    vi.useFakeTimers();
    render(<ConsentBanner initialConsent={null} />, { wrapper: Wrapper });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByTestId("consent-banner")).toBeInTheDocument();
  });

  it("declining persists the opt-out cookie and hides the banner", async () => {
    const user = userEvent.setup();
    render(<ConsentBanner initialConsent={null} />, { wrapper: Wrapper });

    await user.click(screen.getByTestId("consent-decline"));

    expect(document.cookie).toContain(`${CONSENT_COOKIE}=declined`);
    expect(screen.queryByTestId("consent-banner")).not.toBeInTheDocument();
  });
});