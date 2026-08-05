"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";

const sensitiveParams = ["token", "secret", "key", "password", "auth", "code", "email", "signature"];

export function SpeedInsightsWithRedaction() {
  return (
    <SpeedInsights
      beforeSend={(data) => {
        if (!data.url) return data;
        const url = new URL(data.url);
        sensitiveParams.forEach((param) => {
          if (url.searchParams.has(param)) {
            url.searchParams.set(param, "[REDACTED]");
          }
        });
        return { ...data, url: url.toString() };
      }}
    />
  );
}
