"use client";

import { logger } from "@/lib/logger";
import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * Root-level error boundary that replaces the entire layout when an
 * error occurs in the root `layout.tsx`.
 *
 * Unlike route-level `error.tsx`, this component must define its own
 * `<html>` and `<body>` tags because the root layout has already failed.
 * Logs the error via pino before rendering a minimal fallback UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.captureException(error);
    }
    logger.error({ err: error.message, digest: error.digest }, "global error boundary caught");
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", maxWidth: 480, padding: 24 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Critical error</h1>
          <p style={{ color: "#666", marginBottom: 24 }}>
            {error.message || "The application encountered a critical error."}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 24px",
              border: "1px solid #ccc",
              borderRadius: 6,
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
