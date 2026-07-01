"use client";

import { logger } from "@/lib/logger";
import { useEffect } from "react";

/**
 * Client component that registers global error handlers for uncaught
 * exceptions and unhandled promise rejections.
 *
 * Every detected error is forwarded to the pino logger so that client-side
 * crashes are visible in the console and, in production, in Vercel's log
 * ingestion pipeline.
 *
 * Renders nothing — this component exists only for its side effects.
 */
export function UnhandledErrorLogger() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      logger.error(event.reason, "unhandled promise rejection");
    };

    const handleError = (event: ErrorEvent) => {
      logger.error(event.error || event.message, "uncaught error");
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}
