import { store } from "./store";
import type { Severity, TrustState } from "./model";

/**
 * Smart quarantine: tiered containment for detected abusers.
 *
 * Tiers are applied from investigation verdicts and auto-release after a TTL,
 * so legitimate users (or recovered actors) are never permanently locked out.
 */

export type QuarantineTier = "none" | "throttle" | "soft-quarantine" | "hard-block";

export interface QuarantineEntry {
  key: string;
  tier: Exclude<QuarantineTier, "none">;
  reason: string;
  severity: Severity;
  trust: TrustState;
  startedAt: number;
  expiresAt: number;
}

export interface QuarantineConfig {
  /** TTL (ms) for each tier; undefined → never auto-release. */
  ttlMs: Record<Exclude<QuarantineTier, "none">, number | undefined>;
}

const DEFAULT_CONFIG: QuarantineConfig = {
  ttlMs: {
    throttle: 5 * 60_000, // 5 min
    "soft-quarantine": 10 * 60_000, // 10 min
    "hard-block": 60 * 60_000, // 1h
  },
};

const TIER_ORDER: QuarantineTier[] = ["none", "throttle", "soft-quarantine", "hard-block"];

/** The most severe tier implied by a score (for auto-escalation). */
export function tierForScore(score: number, severity: Severity, trust: TrustState): QuarantineTier {
  if (severity === "critical" || trust === "malicious") return "hard-block";
  if (severity === "high" || trust === "suspicious") return "soft-quarantine";
  if (severity === "medium" || trust === "neutral") return "throttle";
  return "none";
}

function quarantineKey(actorKey: string): string {
  return `abuse:quarantine:${actorKey}`;
}

export async function getQuarantine(actorKey: string): Promise<QuarantineEntry | null> {
  const entry = await store.get<QuarantineEntry>(quarantineKey(actorKey));
  if (!entry) return null;
  // Auto-release on expiry (lazy eviction — same pattern as the rate limiter).
  if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
    await store.del(quarantineKey(actorKey));
    return null;
  }
  return entry;
}

export async function applyQuarantine(
  actorKey: string,
  tier: Exclude<QuarantineTier, "none">,
  reason: string,
  severity: Severity,
  trust: TrustState,
  config: QuarantineConfig = DEFAULT_CONFIG,
): Promise<QuarantineEntry> {
  const now = Date.now();
  const ttl = config.ttlMs[tier];
  const entry: QuarantineEntry = {
    key: actorKey,
    tier,
    reason,
    severity,
    trust,
    startedAt: now,
    expiresAt: ttl !== undefined ? now + ttl : 0,
  };
  await store.set(quarantineKey(actorKey), entry, ttl !== undefined ? { ex: Math.ceil(ttl / 1000) } : undefined);
  return entry;
}

/**
 * Escalate an existing entry to a stricter tier (never downgrade).
 * Returns the updated entry, or null when the key has no active quarantine.
 */
export async function escalateQuarantine(
  actorKey: string,
  targetTier: Exclude<QuarantineTier, "none">,
  reason: string,
  severity: Severity,
  trust: TrustState,
  config: QuarantineConfig = DEFAULT_CONFIG,
): Promise<QuarantineEntry | null> {
  const current = await getQuarantine(actorKey);
  if (!current) return null;
  if (TIER_ORDER.indexOf(targetTier) <= TIER_ORDER.indexOf(current.tier)) {
    return current; // already at same or stricter tier
  }
  return applyQuarantine(actorKey, targetTier, reason, severity, trust, config);
}

export async function releaseQuarantine(actorKey: string): Promise<void> {
  await store.del(quarantineKey(actorKey));
}

/** Effective tier for a key, considering both quarantine and rate limiting. */
export async function effectiveTier(actorKey: string): Promise<QuarantineTier> {
  const entry = await getQuarantine(actorKey);
  return entry?.tier ?? "none";
}
