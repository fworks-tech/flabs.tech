import { store } from './store';

/**
 * Per-actor cost budgeting for the chat endpoint.
 *
 * Counters live in the store adapter (Upstash Redis in production), so the
 * budget is shared by every serverless instance instead of resetting per
 * process. Accounting is approximate: the request estimate is added up front
 * and corrected with the provider's actual usage when the stream completes.
 */

export const MAX_TOKENS_PER_REQUEST = 4000;
const MAX_COST_PER_HOUR_USD = 0.5; // ~$0.50/hour budget
const TOKEN_COST_PER_1M = 0.47; // qwen3.8-flash on OpenCode Zen (output upper bound)
const BUCKET_MS = 60 * 60 * 1000; // 1 hour
const BUCKET_TTL_SECONDS = 2 * 60 * 60; // keep the bucket readable past its window

export interface CostCheck {
  allowed: boolean;
  retryAfter: number;
  /** Hour bucket to adjust once the provider reports actual usage. */
  usageKey: string;
  /** Tokens already counted for this request (0 when denied). */
  estimatedTokens: number;
}

function bucketKey(identifier: string, now = Date.now()): string {
  return `abuse:cost:${identifier}:${Math.floor(now / BUCKET_MS)}`;
}

function secondsToNextBucket(now = Date.now()): number {
  return Math.max(1, Math.ceil(((Math.floor(now / BUCKET_MS) + 1) * BUCKET_MS - now) / 1000));
}

/** Rough approximation: ~4 chars per token for English. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function calculateCost(tokens: number): number {
  return (tokens / 1_000_000) * TOKEN_COST_PER_1M;
}

export async function checkCostLimit(
  identifier: string,
  estimatedTokens: number,
): Promise<CostCheck> {
  const usageKey = bucketKey(identifier);
  const used = (await store.get<number>(usageKey)) ?? 0;

  // Approximate check-then-act: two concurrent requests can both pass before
  // either increments. Acceptable because the cap is small ($0.50/h) and each
  // request is bounded by MAX_TOKENS_PER_REQUEST; strict atomicity would need
  // a Redis Lua script (Upstash eval) and is deferred.
  if (calculateCost(used + estimatedTokens) > MAX_COST_PER_HOUR_USD) {
    return { allowed: false, retryAfter: secondsToNextBucket(), usageKey, estimatedTokens: 0 };
  }

  await store.incrby(usageKey, estimatedTokens, BUCKET_TTL_SECONDS);
  return { allowed: true, retryAfter: 0, usageKey, estimatedTokens };
}

/**
 * Correct the request estimate with the provider's actual token usage.
 * `deltaTokens` may be negative when the estimate overshot; the counter is
 * clamped at zero so one overestimate cannot buy a free request later.
 */
export async function recordActualUsage(usageKey: string, deltaTokens: number): Promise<void> {
  if (!Number.isFinite(deltaTokens) || deltaTokens === 0) return;
  if (deltaTokens < 0) {
    const used = (await store.get<number>(usageKey)) ?? 0;
    if (used + deltaTokens <= 0) {
      await store.del(usageKey);
      return;
    }
  }
  await store.incrby(usageKey, deltaTokens, BUCKET_TTL_SECONDS);
}
