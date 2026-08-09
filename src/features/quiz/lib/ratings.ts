import { store } from "@/lib/abuse/store";
import { sanitizeInput } from "./leaderboard";

export const RATINGS_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_COMMENT = 200;
const MAX_COMMENTS = 100;
const COMMENTS_KEY = "quiz:ratings:comments";
export const REFERRAL_CLICKS_KEY = "quiz:referral:clicks";

export interface RatingPayload {
  rating: 0 | 1;
  comment: string;
}

/** Validates a raw `/api/quiz/rating` body. `comment` is optional. */
export function validateRatingPayload(raw: unknown): RatingPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const rating = r.rating;
  if (rating !== 0 && rating !== 1) return null;

  const comment =
    typeof r.comment === "string" ? sanitizeInput(r.comment).slice(0, MAX_COMMENT) : "";

  return { rating, comment };
}

/** ISO day key (`YYYY-MM-DD`, UTC) used for rating day counters. */
export function isoDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Records a recommendation rating: atomic `incr` day counters (up/down)
 * plus an optional bounded comment list. Counters are separate keys by
 * design — see ADR-003 (no hash ops on the store adapter).
 */
export async function addRating(payload: RatingPayload): Promise<void> {
  const day = isoDayKey();
  const suffix = payload.rating === 1 ? "up" : "down";
  await store.incr(`quiz:ratings:${day}:${suffix}`, RATINGS_TTL_SECONDS);

  if (payload.comment) {
    const comments = (await store.get<string[]>(COMMENTS_KEY)) ?? [];
    comments.push(payload.comment);
    await store.set(COMMENTS_KEY, comments.slice(-MAX_COMMENTS), { ex: RATINGS_TTL_SECONDS });
  }
}

export interface RatingsAggregate {
  up: number;
  down: number;
}

/**
 * Aggregates rating counters across all day keys. Returns null when the
 * store is unreachable so callers can hide the stat gracefully.
 */
export async function getRatingsAggregate(): Promise<RatingsAggregate | null> {
  try {
    const keys = await store.keys("quiz:ratings:*");
    let up = 0;
    let down = 0;
    for (const key of keys) {
      if (!key.endsWith(":up") && !key.endsWith(":down")) continue;
      const count = (await store.get<number>(key)) ?? 0;
      if (key.endsWith(":up")) up += count;
      else down += count;
    }
    return { up, down };
  } catch {
    return null;
  }
}

export async function getReferralClicks(): Promise<number> {
  try {
    return (await store.get<number>(REFERRAL_CLICKS_KEY)) ?? 0;
  } catch {
    return 0;
  }
}

/** Server-side referral click counter (works without PostHog consent). */
export async function countReferralClick(): Promise<void> {
  await store.incr(REFERRAL_CLICKS_KEY);
}
