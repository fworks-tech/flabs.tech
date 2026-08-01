import { PostHog } from "posthog-node";
import { logger } from "@/lib/logger";
import type { InvestigationCase } from "./investigation";
import type { QuarantineTier } from "./quarantine";

/**
 * Centralized abuse observability:
 * - structured pino logs (scope: "abuse")
 * - server-side PostHog events (posthog-node)
 * - Slack + Discord webhooks (coalesced per severity bucket, env-gated)
 */

export interface AbuseEvent {
  name:
    | "abuse.incident"
    | "abuse.quarantine"
    | "abuse.block"
    | "abuse.escalation";
  key: string;
  tier?: QuarantineTier;
  severity?: string;
  score?: number;
  confidence?: number;
  detail?: string;
}

let posthog: PostHog | null = null;
function getPostHog(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!apiKey) return null;
  if (!posthog) {
    posthog = new PostHog(apiKey, {
      host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
      flushAt: 1,
    });
  }
  return posthog;
}

/** Log + emit a PostHog event + fan out to configured webhooks. */
export async function notify(event: AbuseEvent, caseData?: InvestigationCase | null): Promise<void> {
  const payload = {
    scope: "abuse",
    ...event,
    case: caseData
      ? {
          severity: caseData.severity,
          trust: caseData.trust,
          score: caseData.score,
          confidence: caseData.confidence,
          signalCount: caseData.signals.length,
        }
      : undefined,
  };

  logger.warn(payload, `abuse event: ${event.name}`);

  try {
    const ph = getPostHog();
    if (ph) {
      ph.capture({
        distinctId: event.key,
        event: event.name,
        properties: {
          tier: event.tier,
          severity: event.severity,
          score: event.score,
          confidence: event.confidence,
          detail: event.detail,
        },
      });
      // fire-and-forget flush
      ph.flush().catch(() => undefined);
    }
  } catch (error) {
    logger.error(error, "failed to emit PostHog abuse event");
  }

  await dispatchWebhooks(event);
}

// --- webhooks (env-gated, coalesced) ---

const WEBHOOK_COOLDOWN_MS = 5 * 60_000;
const webhookLastSent = new Map<string, number>();

async function dispatchWebhooks(event: AbuseEvent): Promise<void> {
  const now = Date.now();
  const bucket = `${event.name}:${event.severity ?? "unknown"}`;
  const last = webhookLastSent.get(bucket) ?? 0;
  if (now - last < WEBHOOK_COOLDOWN_MS) return;
  webhookLastSent.set(bucket, now);

  const text = `*[flabs.tech abuse]* ${event.name} — ${event.key}\n- severity: ${event.severity ?? "n/a"}\n- tier: ${event.tier ?? "n/a"}\n- score: ${event.score?.toFixed(3) ?? "n/a"}\n- detail: ${event.detail ?? "-"}`;

  await Promise.allSettled([
    sendWebhook(process.env.SLACK_WEBHOOK_URL, { text }),
    sendWebhook(process.env.DISCORD_WEBHOOK_URL, { content: text }),
  ]);
}

async function sendWebhook(url: string | undefined, body: Record<string, unknown>): Promise<void> {
  if (!url) return; // env placeholder → skip send, still logged
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "abuse webhook delivery failed");
    }
  } catch (error) {
    logger.error(error, "abuse webhook delivery error");
  }
}

/** For tests: reset the in-memory webhook cooldown state. */
export function _resetWebhookCooldowns(): void {
  webhookLastSent.clear();
}
