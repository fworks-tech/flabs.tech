import { describe, expect, it, vi, beforeEach } from "vitest";
import { logger } from "@/lib/logger";
import { _resetWebhookCooldowns, notify } from "@/lib/abuse/notify";

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

vi.mock("posthog-node", () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    capture: vi.fn(),
    flush: vi.fn(() => Promise.resolve()),
  })),
}));

describe("notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetWebhookCooldowns();
    process.env.POSTHOG_API_KEY = "";
    process.env.SLACK_WEBHOOK_URL = "";
    process.env.DISCORD_WEBHOOK_URL = "";
  });

  it("logs an abuse event", async () => {
    await notify({ name: "abuse.incident", key: "1.2.3.4", severity: "high", score: 0.7 });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "abuse", name: "abuse.incident" }),
      expect.stringContaining("abuse event"),
    );
  });

  it("skips PostHog when no API key is configured", async () => {
    const { PostHog } = await import("posthog-node");
    await notify({ name: "abuse.block", key: "1.2.3.4", tier: "hard-block" });
    expect(PostHog).not.toHaveBeenCalled();
  });

  it("includes case summary in the log payload", async () => {
    const caseData = {
      key: "1.2.3.4",
      features: {} as never,
      score: 0.9,
      confidence: 1,
      severity: "critical",
      trust: "malicious",
      signals: [{ kind: "injection", detail: "x", at: Date.now() }],
      firstSeenAt: 0,
      updatedAt: 0,
      decidedAt: 0,
      decision: "contained",
    } as const;
    await notify({ name: "abuse.escalation", key: "1.2.3.4", score: 0.9 }, caseData);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        case: expect.objectContaining({ severity: "critical", trust: "malicious", signalCount: 1 }),
      }),
      expect.any(String),
    );
  });
});
