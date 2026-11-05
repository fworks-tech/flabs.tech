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

/** What the client sends: the run nonce plus the picked answer indexes. */
export interface ScoreSubmission {
  displayName: string;
  runId: string;
  /** Picked answer index per question, in order. -1 = timeout. */
  answers: number[];
  durationMs: number;
}

/** What the server derives and stores: never trusted from the client. */
export interface ScorePayload {
  displayName: string;
  score: number;
  correct: number;
  total: number;
  maxStreak: number;
  durationMs: number;
}

export const MAX_DISPLAY_NAME = 20;
export const MAX_TOTAL = 20;
export const MIN_TOTAL = 1;
/** Sanity floor: a legit run takes at least ~0.5s per question on average. */
export const MIN_MS_PER_QUESTION = 500;

export const ALL_TIME_KEY = 'quiz:leaderboard';

export function weeklyKey(date = new Date()): string {
  return `quiz:leaderboard:${isoWeekKey(date)}`;
}

/** Strips control characters and collapses whitespace (chat-route pattern). */
export function sanitizeInput(text: string): string {
  return text
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates a raw `/api/quiz/score` body. Returns the normalized submission
 * or null when anything fails validation. The score itself is derived by the
 * route from the run seed — this only checks shape and sanity.
 */
export function validateScoreSubmission(raw: unknown): ScoreSubmission | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const displayName =
    typeof r.displayName === 'string'
      ? sanitizeInput(r.displayName).slice(0, MAX_DISPLAY_NAME)
      : '';
  if (displayName.length === 0) return null;

  const runId = typeof r.runId === 'string' ? r.runId.trim() : '';
  if (runId.length === 0 || runId.length > 64) return null;

  if (!Array.isArray(r.answers) || r.answers.length < MIN_TOTAL || r.answers.length > MAX_TOTAL) {
    return null;
  }
  const answers: number[] = [];
  for (const value of r.answers) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < -1 || value > 3) {
      return null;
    }
    answers.push(value);
  }

  const durationMs = typeof r.durationMs === 'number' ? r.durationMs : NaN;
  if (!Number.isFinite(durationMs) || durationMs < answers.length * MIN_MS_PER_QUESTION) {
    return null;
  }

  return { displayName, runId, answers, durationMs };
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
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/** Epoch ms of the next Monday 00:00 UTC (1–7 days away). */
export function nextMondayEpochMs(date = new Date()): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysUntilMonday = (8 - d.getUTCDay()) % 7 || 7;
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

/**
 * Parses a leaderboard member. The Upstash SDK auto-deserializes JSON
 * responses, so `member` may arrive as a JSON string (raw REST, mocks,
 * in-memory fallback) or as an already-parsed object. Handles both.
 */
export function parseMember(member: string | Record<string, unknown>): MemberData | null {
  let parsed: Record<string, unknown>;
  if (typeof member === 'string') {
    try {
      parsed = JSON.parse(member) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else {
    parsed = member;
  }
  if (
    typeof parsed.id !== 'string' ||
    typeof parsed.displayName !== 'string' ||
    typeof parsed.score !== 'number' ||
    typeof parsed.accuracy !== 'number' ||
    typeof parsed.maxStreak !== 'number' ||
    typeof parsed.ts !== 'number'
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
}
