/**
 * Custom event tracking utility wrapping Vercel Analytics.
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
 * Events are automatically collected in the Vercel Analytics dashboard.
 * No additional setup required — `@vercel/analytics` is already mounted
 * in the root layout.
 */

import { track } from "@vercel/analytics";

export type EventName =
  | "cta_click"
  | "nav_click"
  | "project_view"
  | "post_click"
  | "social_link"
  | "scroll_depth";

type EventProperties = Record<string, string | number | boolean>;

export function trackEvent(name: EventName, properties?: EventProperties) {
  if (typeof window === "undefined") return;
  track(name, properties);
}
