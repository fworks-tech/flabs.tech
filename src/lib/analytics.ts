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
