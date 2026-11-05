import { store } from '@/lib/abuse/store';

/**
 * Durable per-actor rate limit.
 *
 * The counter lives in the store adapter (Upstash Redis in production), so
 * the limit is shared by every serverless instance. The in-memory fallback
 * keeps local development and tests working.
 *
 * The window is a sliding TTL: each request refreshes the expiry, so a client
 * that keeps hammering stays blocked until it goes quiet for `windowSeconds`.
 */
const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_ATTEMPTS = 5;

export async function rateLimit(
  identifier: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  windowSeconds: number = DEFAULT_WINDOW_SECONDS,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const count = await store.incr(`rl:${identifier}`, windowSeconds);
  if (count > maxAttempts) {
    return { allowed: false, retryAfter: windowSeconds };
  }
  return { allowed: true, retryAfter: 0 };
}
