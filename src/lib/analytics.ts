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
 * Events are collected in the Vercel Analytics dashboard and in PostHog
 * (initialized by `PostHogTracker`). No additional setup required.
 */

import { track } from "@vercel/analytics";
import posthog from "posthog-js";

export type EventName =
  | "cta_click"
  | "nav_click"
  | "project_view"
  | "post_click"
  | "social_link"
  | "scroll_depth"
  | "ai_assistant_open"
  | "ai_assistant_close"
  | "ai_assistant_send"
  | "ai_assistant_error";

type EventProperties = Record<string, string | number | boolean>;

export function trackEvent(name: EventName, properties?: EventProperties) {
  if (typeof window === "undefined") return;
  track(name, properties);
  try {
    posthog.capture(name, properties ?? {});
  } catch {
    // PostHog not initialized or blocked — Vercel track already succeeded.
  }
}
