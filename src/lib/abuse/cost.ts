/**
 * Per-actor cost budgeting for the chat endpoint.
 *
 * Approximate accounting (estimates before the stream, corrected to actual
 * usage once it completes). Sweeps stale entries periodically so the in-memory
 * map cannot grow without bound — same pattern as the rate limiter.
 */

export const MAX_TOKENS_PER_REQUEST = 4000;
const MAX_COST_PER_HOUR_USD = 0.5; // ~$0.50/hour budget
const TOKEN_COST_PER_1M = 0.28; // mimo-v2.5 on OpenCode Go
const USAGE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CLEANUP_INTERVAL_MS = 300_000; // 5 min

interface UsageEntry {
  tokens: number;
  timestamp: number;
  cost: number;
}

const usageMap = new Map<string, UsageEntry[]>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entries] of usageMap) {
      const recent = entries.filter((e) => now - e.timestamp < USAGE_WINDOW_MS);
      if (recent.length === 0) {
        usageMap.delete(key);
      } else if (recent.length !== entries.length) {
        usageMap.set(key, recent);
      }
    }
    if (usageMap.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
}

ensureCleanup();

/** Rough approximation: ~4 chars per token for English. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function calculateCost(tokens: number): number {
  return (tokens / 1_000_000) * TOKEN_COST_PER_1M;
}

export function checkCostLimit(
  identifier: string,
  estimatedTokens: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entries = usageMap.get(identifier) || [];

  // Filter to current window
  const recentEntries = entries.filter((e) => now - e.timestamp < USAGE_WINDOW_MS);

  const totalCost = recentEntries.reduce((sum, e) => sum + e.cost, 0);
  const estimatedCost = calculateCost(estimatedTokens);

  if (totalCost + estimatedCost > MAX_COST_PER_HOUR_USD) {
    // Find when oldest entry expires
    const oldestEntry = recentEntries[0];
    const retryAfter = oldestEntry
      ? Math.ceil((oldestEntry.timestamp + USAGE_WINDOW_MS - now) / 1000)
      : 3600;
    return { allowed: false, retryAfter };
  }

  // Add estimated usage (corrected to actual after the response completes)
  recentEntries.push({ tokens: estimatedTokens, timestamp: now, cost: estimatedCost });
  usageMap.set(identifier, recentEntries);

  return { allowed: true, retryAfter: 0 };
}

/** Replace the latest estimated entry with the provider's actual usage. */
export function recordActualUsage(identifier: string, actualTokens: number): void {
  const now = Date.now();
  const entries = usageMap.get(identifier) || [];
  const recentEntries = entries.filter((e) => now - e.timestamp < USAGE_WINDOW_MS);

  if (recentEntries.length > 0) {
    const lastEntry = recentEntries[recentEntries.length - 1];
    lastEntry.tokens = actualTokens;
    lastEntry.cost = calculateCost(actualTokens);
  } else {
    recentEntries.push({ tokens: actualTokens, timestamp: now, cost: calculateCost(actualTokens) });
  }

  usageMap.set(identifier, recentEntries);
}

/** For tests: reset all tracked usage. */
export function _resetUsage(): void {
  usageMap.clear();
}
