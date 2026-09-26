/**
 * Custom event tracking utility — dual-emits to Vercel Analytics and PostHog.
 *
 * Use this in client components to track user interactions:
 *
 * @example
 * ```tsx
 * "use client";
 * import { trackEvent } from "@/lib/analytics";
 *
 * <button onClick={() => trackEvent("cta_click", { label: "View Projects" })}>
 *   View Projects
 * </button>
 * ```
 *
 * The accepted event names are derived from the self-hosted taxonomy
 * (`EVENT_TYPES` in `@/lib/tracking-store`) so every emitted name is
 * guaranteed to be accepted by the ingest endpoint.
 */

import { track } from '@vercel/analytics';
import posthog from 'posthog-js';
import { getConsent, track as trackSelfHosted } from '@/lib/tracking';
import type { EventName } from '@/lib/tracking-store';

export type { EventName };

type EventProperties = Record<string, string | number | boolean>;

export function trackEvent(name: EventName, properties?: EventProperties) {
  if (typeof window === 'undefined') return;
  // Vercel Analytics is a third party too — it inherits the same opt-out as
  // PostHog and the self-hosted tracker, otherwise declining leaks anyway.
  if (getConsent() !== 'declined') {
    track(name, properties);
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture(name, properties ?? {});
    }
  }
  trackSelfHosted(name, {
    path: typeof properties?.path === 'string' ? properties.path : undefined,
    value: typeof properties?.value === 'number' ? properties.value : undefined,
    label: typeof properties?.label === 'string' ? properties.label : undefined,
  });
}
