"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getConsent, initTracking, startTrackingSession, track } from "@/lib/tracking";

const SCROLL_THRESHOLDS = [25, 50, 75, 100];

/**
 * Wire up consent-gated UX tracking:
 * - session start + initial page view (on mount, or when consent is given)
 * - page view on every route change
 * - scroll depth milestones (25/50/75/100%)
 * - external link and internal nav clicks
 */
export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    initTracking();

    const started = () => startTrackingSession();
    if (getConsent() === "accepted") {
      started();
    }
    window.addEventListener("fa:consent", started as EventListener);

    const firedThresholds = new Set<number>();

    const onScroll = () => {
      if (getConsent() !== "accepted") return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const depth = Math.round((window.scrollY / max) * 100);
      for (const threshold of SCROLL_THRESHOLDS) {
        if (depth >= threshold && !firedThresholds.has(threshold)) {
          firedThresholds.add(threshold);
          track("scroll_depth", { value: threshold });
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      if (getConsent() !== "accepted") return;
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (/^https?:\/\//i.test(href) && !href.startsWith(window.location.origin)) {
        track("external_link", { path: href });
      } else if (href.startsWith("/")) {
        track("nav_click", { path: href });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("fa:consent", started as EventListener);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    if (getConsent() === "accepted") {
      track("page_view", { path: pathname });
    }
  }, [pathname]);
}
