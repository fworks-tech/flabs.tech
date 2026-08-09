/**
 * Shared leaderboard types, validation and key helpers.
 *
 * Server-safe (no DOM, no `"use client"`): imported by both the API
 * routes and the client-side hooks/panel for types and formatting.
 */

export interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  score: number;
  accuracy: number;
  maxStreak: number;
  ts: number;
}

export interface ScorePayload {
  displayName: string;
  score: number;
  correct: number;
  total: number;
  maxStreak: number;
  durationMs: number;
}

export const MAX_DISPLAY_NAME = 20;
export const MAX_SCORE = 10_000;
export const MAX_TOTAL = 20;
export const MIN_TOTAL = 1;
/** Sanity floor: a legit run takes at least ~1s per question. */
export const MIN_MS_PER_QUESTION = 1000;

export const ALL_TIME_KEY = "quiz:leaderboard";

export function weeklyKey(date = new Date()): string {
  return `quiz:leaderboard:${isoWeekKey(date)}`;
}

/** Strips control characters and collapses whitespace (chat-route pattern). */
export function sanitizeInput(text: string): string {
  return text.replace(/[\x00-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Validates a raw `/api/quiz/score` body. Returns the normalized payload
 * or null when anything fails validation.
 */
export function validateScorePayload(raw: unknown): ScorePayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const displayName =
    typeof r.displayName === "string"
      ? sanitizeInput(r.displayName).slice(0, MAX_DISPLAY_NAME)
      : "";
  if (displayName.length === 0) return null;

  const score = typeof r.score === "number" && Number.isInteger(r.score) ? r.score : NaN;
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return null;

  const correct = typeof r.correct === "number" && Number.isInteger(r.correct) ? r.correct : NaN;
  const total = typeof r.total === "number" && Number.isInteger(r.total) ? r.total : NaN;
  if (!Number.isFinite(total) || total < MIN_TOTAL || total > MAX_TOTAL) return null;
  if (!Number.isFinite(correct) || correct < 0 || correct > total) return null;

  const maxStreak =
    typeof r.maxStreak === "number" && Number.isInteger(r.maxStreak) && r.maxStreak >= 0
      ? r.maxStreak
      : 0;

  const durationMs = typeof r.durationMs === "number" ? r.durationMs : NaN;
  if (!Number.isFinite(durationMs) || durationMs < total * MIN_MS_PER_QUESTION) return null;

  return { displayName, score, correct, total, maxStreak, durationMs };
}

/**
 * Monday-based ISO-8601 week key (`YYYY-Www`), used to isolate the weekly
 * leaderboard. Same rule as `Date.prototype.toISOString` weeks (UTC).
 */
export function isoWeekKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7; // Mon = 1 … Sun = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const isoYear = d.getUTCFullYear();
  const jan1 = Date.UTC(isoYear, 0, 1);
  const week = Math.ceil(((d.getTime() - jan1) / 86_400_000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** Epoch ms of the next Monday 00:00 UTC (1–7 days away). */
export function nextMondayEpochMs(date = new Date()): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysUntilMonday = ((8 - d.getUTCDay()) % 7) || 7;
  return d.getTime() + daysUntilMonday * 86_400_000;
}

/** Seconds until the next Monday 00:00 UTC (weekly key expiry). */
export function weeklyTtlSeconds(date = new Date()): number {
  return Math.max(1, Math.floor((nextMondayEpochMs(date) - Date.now()) / 1000));
}

/** The ZSET member for a saved score: JSON carrying display data. */
export function leaderboardMember(payload: ScorePayload, id: string): string {
  return JSON.stringify({
    id,
    displayName: payload.displayName,
    score: payload.score,
    accuracy: payload.total === 0 ? 0 : payload.correct / payload.total,
    maxStreak: payload.maxStreak,
    ts: Date.now(),
  });
}

export interface MemberData {
  id: string;
  displayName: string;
  score: number;
  accuracy: number;
  maxStreak: number;
  ts: number;
}

/** Parses a leaderboard member JSON payload; null when malformed. */
export function parseMember(member: string): MemberData | null {
  try {
    const parsed = JSON.parse(member) as Record<string, unknown>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.score !== "number" ||
      typeof parsed.accuracy !== "number" ||
      typeof parsed.maxStreak !== "number" ||
      typeof parsed.ts !== "number"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      displayName: parsed.displayName.slice(0, MAX_DISPLAY_NAME),
      score: parsed.score,
      accuracy: parsed.accuracy,
      maxStreak: parsed.maxStreak,
      ts: parsed.ts,
    };
  } catch {
    return null;
  }
}
