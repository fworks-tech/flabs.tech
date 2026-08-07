"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import posthog from "posthog-js";
import { getConsent, subscribeConsent } from "@/lib/tracking";

let initialized = false;

export default function PostHogTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const consentedRef = useRef(getConsent() === "accepted");

  const ensureInit = useCallback(() => {
    if (initialized) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key || !host) {
      // Warn instead of throwing so `next dev` (and the e2e suite that boots it)
      // stays functional when PostHog is not configured — analytics are simply
      // disabled. Production is a silent no-op.
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "NEXT_PUBLIC_POSTHOG_KEY/HOST variables required by PostHog are missing or un-configured, events will be silently missed",
        );
      }
      return;
    }

    posthog.init(key, {
      api_host: host,
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NODE_ENV === "development",
    });
    initialized = true;
  }, []);

  // Privacy-first: PostHog is only initialized (and only starts writing its
  // `ph_*` cookies) after the visitor accepts the consent banner. Accepting
  // late fires the pageview for the current page.
  useEffect(() => {
    if (consentedRef.current) {
      ensureInit();
    }
    return subscribeConsent(() => {
      if (getConsent() === "accepted") {
        consentedRef.current = true;
        ensureInit();
        if (initialized) posthog.capture("$pageview");
      } else {
        consentedRef.current = false;
      }
    });
  }, [ensureInit]);

  useEffect(() => {
    if (!consentedRef.current || !initialized) return;
    posthog.capture("$pageview");
  }, [pathname, searchParams]);

  return null;
}
