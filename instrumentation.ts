import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { LoggerProvider, SimpleLogRecordProcessor } from "@opentelemetry/sdk-logs";

/**
 * PostHog OTLP log export.
 *
 * Next.js loads this file at startup. Server-side pino logs remain the primary
 * log stream; this provider proves the OTLP pipeline is online by emitting a
 * startup record that shows up in the PostHog Logs page.
 *
 * Requires `POSTHOG_API_KEY` + `POSTHOG_HOST` (falls back to `NEXT_PUBLIC_POSTHOG_KEY`).
 */

const SERVICE_NAME = "flabs-tech";

export function register(): void {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const apiKey =
      process.env.POSTHOG_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.POSTHOG_HOST || "https://us.i.posthog.com";
    if (!apiKey) return;

    const exporter = new OTLPLogExporter({
      url: `${host}/otlp/v1/logs`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        "service.name": SERVICE_NAME,
      }),
      processors: [new SimpleLogRecordProcessor({ exporter })],
    });

    loggerProvider
      .getLogger(SERVICE_NAME)
      .emit({ severityText: "INFO", body: "flabs-tech server started (OTLP log pipeline online)" });
  }
}
