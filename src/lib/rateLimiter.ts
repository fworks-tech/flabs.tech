const attempts = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 60_000;

/**
 * Simple in-memory rate limiter.
 *
 * Tracks request attempts per identifier (e.g. IP address) within a sliding
 * time window. Returns whether the request is allowed and the number of
 * seconds the caller should wait before retrying.
 *
 * @param identifier - Unique key for the client (IP, user ID, etc.)
 * @param maxAttempts - Max allowed requests in the window (default: 5)
 * @param windowMs - Time window in milliseconds (default: 60000)
 * @returns Object with `allowed` (boolean) and `retryAfter` (seconds, 0 if allowed)
 */
export function rateLimit(
  identifier: string,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  windowMs = DEFAULT_WINDOW_MS,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = attempts.get(identifier);

  if (!entry || now > entry.resetAt) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}
