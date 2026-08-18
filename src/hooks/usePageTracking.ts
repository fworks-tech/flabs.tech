"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getConsent, initTracking, startTrackingSession, track } from "@/lib/tracking";

const SCROLL_THRESHOLDS = [25, 50, 75, 100];

/**
 * Wire up opt-out UX tracking (no tracking after the visitor declines):
 * - exactly one session start + initial page view per page load (or when
 *   consent is re-enabled) — never duplicated by later consent change events
 * - page view on every route change
 * - scroll depth milestones (25/50/75/100%)
 * - anchor clicks, classified exactly once by a single document listener:
 *   `data-track-event` overrides the event type, otherwise external links are
 *   `external_link` and internal `/` links are `nav_click`
 */
export function usePageTracking() {
  const pathname = usePathname();
  const sessionStarted = useRef(false);
  const skipInitialPageView = useRef(true);
  const firedThresholds = useRef(new Set<number>());

  useEffect(() => {
    initTracking();

    const started = () => {
      if (getConsent() === "declined") return;
      if (sessionStarted.current) return;
      sessionStarted.current = true;
      startTrackingSession();
    };

    const onConsentChange = () => {
      if (getConsent() === "declined") {
        // Allow a fresh session if the visitor re-enables via clearConsent().
        sessionStarted.current = false;
        return;
      }
      started();
    };

    started();
    window.addEventListener("fa:consent", onConsentChange);

    const onScroll = () => {
      if (getConsent() === "declined") return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const depth = Math.round((window.scrollY / max) * 100);
      for (const threshold of SCROLL_THRESHOLDS) {
        if (depth >= threshold && !firedThresholds.current.has(threshold)) {
          firedThresholds.current.add(threshold);
          track("scroll_depth", { value: threshold });
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      if (getConsent() === "declined") return;
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      const explicit = anchor.getAttribute("data-track-event");
      if (explicit) {
        const label = anchor.getAttribute("data-track-label");
        trackEvent(explicit as Parameters<typeof trackEvent>[0], {
          path: href,
          ...(label ? { label } : {}),
        });
        return;
      }
      if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
        track("external_link", { path: href });
      } else if (href.startsWith("/")) {
        trackEvent("nav_click", { path: href });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("fa:consent", onConsentChange);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    // The initial page view is emitted by `startTrackingSession` on mount —
    // skip the first run so each route change emits exactly one page_view.
    if (skipInitialPageView.current) {
      skipInitialPageView.current = false;
      return;
    }
    if (getConsent() === "declined") return;
    firedThresholds.current.clear();
    track("page_view", { path: pathname });
  }, [pathname]);
}