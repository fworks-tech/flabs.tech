"use client";

import { usePageTracking } from "@/hooks/usePageTracking";

/** Mounted once in the root layout; wires up consent-gated UX tracking. */
export const TrackingProvider = () => {
  usePageTracking();
  return null;
};
