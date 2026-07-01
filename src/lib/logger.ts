import pino from "pino";

const isBrowser = typeof window !== "undefined";
const isEdge = !isBrowser && process.env.NEXT_RUNTIME === "edge";

/**
 * Resolves the effective log level based on the runtime environment.
 *
 * - Browser: reads `NEXT_PUBLIC_LOG_LEVEL` (defaults to `"warn"`)
 * - Server/Edge: reads `LOG_LEVEL` env var (defaults to `"info"` in production, `"debug"` in development)
 */
function getLevel(): string {
  if (isBrowser) {
    return process.env.NEXT_PUBLIC_LOG_LEVEL || "warn";
  }
  return process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");
}

const useTransport = !isBrowser && !isEdge && process.env.NODE_ENV !== "production";

/**
 * Shared pino logger instance.
 *
 * - **Browser**: outputs structured objects to the console via `pino/browser`.
 * - **Server (Node.js)**: outputs JSON; uses `pino-pretty` for human-readable output in development.
 * - **Edge runtime**: outputs JSON without transport (edge does not support worker threads).
 *
 * @example
 * ```ts
 * import { logger } from "@/lib/logger";
 * logger.info({ scope: "api" }, "request received");
 * logger.error(err, "something failed");
 * ```
 */
export const logger = isBrowser
  ? pino({
      level: getLevel(),
      browser: { asObject: true },
    })
  : pino({
      level: getLevel(),
      ...(useTransport && {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
    });
