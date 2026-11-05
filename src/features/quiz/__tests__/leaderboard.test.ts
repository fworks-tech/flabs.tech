import { describe, expect, it } from 'vitest';

import {
  MAX_DISPLAY_NAME,
  leaderboardMember,
  isoWeekKey,
  nextMondayEpochMs,
  parseMember,
  validateScoreSubmission,
  weeklyTtlSeconds,
} from '@/features/quiz/lib/leaderboard';

const submission = {
  displayName: 'Zara',
  runId: 'run-1',
  answers: [0, 1, 2],
  durationMs: 10_000,
};

const payload = {
  displayName: 'Zara',
  score: 3400,
  correct: 17,
  total: 20,
  maxStreak: 9,
  durationMs: 180_000,
};

describe('validateScoreSubmission', () => {
  it('accepts a valid submission', () => {
    expect(validateScoreSubmission(submission)).toEqual(submission);
  });

  it('rejects missing or non-object bodies', () => {
    expect(validateScoreSubmission(null)).toBeNull();
    expect(validateScoreSubmission(undefined)).toBeNull();
    expect(validateScoreSubmission('nope')).toBeNull();
    expect(validateScoreSubmission([])).toBeNull();
  });

  it('strips control chars, collapses whitespace and trims the name', () => {
    const result = validateScoreSubmission({
      ...submission,
      displayName: '  Za\u0000ra\t the \u007FBest ',
    });
    expect(result?.displayName).toBe('Zara the Best');
  });

  it('rejects an empty display name', () => {
    expect(validateScoreSubmission({ ...submission, displayName: '   ' })).toBeNull();
    expect(validateScoreSubmission({ ...submission, displayName: '' })).toBeNull();
  });

  it('truncates the display name to 20 chars', () => {
    const result = validateScoreSubmission({ ...submission, displayName: 'x'.repeat(50) });
    expect(result?.displayName).toBe('x'.repeat(MAX_DISPLAY_NAME));
  });

  it('rejects missing or oversized run ids', () => {
    expect(validateScoreSubmission({ ...submission, runId: '' })).toBeNull();
    expect(validateScoreSubmission({ ...submission, runId: 42 })).toBeNull();
    expect(validateScoreSubmission({ ...submission, runId: 'x'.repeat(65) })).toBeNull();
  });

  it('rejects answers that are not a bounded list of 0..3 picks', () => {
    expect(validateScoreSubmission({ ...submission, answers: [] })).toBeNull();
    expect(validateScoreSubmission({ ...submission, answers: '0,1,2' })).toBeNull();
    expect(validateScoreSubmission({ ...submission, answers: [0, 1, 4] })).toBeNull();
    expect(validateScoreSubmission({ ...submission, answers: [0, 1, -2] })).toBeNull();
    expect(validateScoreSubmission({ ...submission, answers: [0, 1.5, 2] })).toBeNull();
    expect(
      validateScoreSubmission({ ...submission, answers: Array.from({ length: 21 }, () => 0) }),
    ).toBeNull();
  });

  it('rejects durations below the ~0.5s/answered-question sanity floor', () => {
    // 3 answers → the floor is 1.5s, not the whole 20-question deck.
    expect(validateScoreSubmission({ ...submission, durationMs: 1_499 })).toBeNull();
    expect(validateScoreSubmission({ ...submission, durationMs: 1_500 })).not.toBeNull();
  });
});

describe('isoWeekKey', () => {
  it('produces Monday-based ISO week keys', () => {
    expect(isoWeekKey(new Date('2026-08-03T12:00:00Z'))).toBe('2026-W32');
    expect(isoWeekKey(new Date('2026-08-09T12:00:00Z'))).toBe('2026-W32');
    expect(isoWeekKey(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01');
  });

  it('keeps Monday and Sunday of the same week together', () => {
    expect(isoWeekKey(new Date('2026-08-03T00:00:00Z'))).toBe(
      isoWeekKey(new Date('2026-08-09T23:59:59Z')),
    );
  });
});

describe('nextMondayEpochMs / weeklyTtlSeconds', () => {
  it('rolls a Monday forward a full week', () => {
    const monday = new Date('2026-08-03T15:00:00Z');
    const next = new Date(nextMondayEpochMs(monday)).toISOString();
    expect(next).toBe('2026-08-10T00:00:00.000Z');
  });

  it('rolls a Sunday forward a single day', () => {
    const sunday = new Date('2026-08-09T12:00:00Z');
    const next = new Date(nextMondayEpochMs(sunday)).toISOString();
    expect(next).toBe('2026-08-10T00:00:00.000Z');
  });

  it('weeklyTtlSeconds is positive and within a week', () => {
    const ttl = weeklyTtlSeconds(new Date('2026-08-05T00:00:00Z'));
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(7 * 24 * 60 * 60);
  });
});

describe('leaderboardMember / parseMember', () => {
  it('round-trips a saved score', () => {
    const member = leaderboardMember(payload, 'abc-123');
    const parsed = parseMember(member);
    expect(parsed).toMatchObject({
      id: 'abc-123',
      displayName: 'Zara',
      score: 3400,
      accuracy: 17 / 20,
      maxStreak: 9,
    });
    expect(parsed?.ts).toBeGreaterThan(0);
  });

  it('accepts an already-deserialized member (Upstash SDK auto-parses JSON)', () => {
    const member = leaderboardMember(payload, 'abc-123');
    const asObject = JSON.parse(member) as Record<string, unknown>;
    const parsed = parseMember(asObject);
    expect(parsed).toMatchObject({
      id: 'abc-123',
      displayName: 'Zara',
      score: 3400,
      accuracy: 17 / 20,
      maxStreak: 9,
    });
  });

  it('returns null for malformed members', () => {
    expect(parseMember('not json')).toBeNull();
    expect(parseMember('{"id":1}')).toBeNull();
    expect(parseMember(JSON.stringify({ id: 'x', displayName: 'y', score: 'high' }))).toBeNull();
    expect(parseMember({ id: 1 })).toBeNull();
  });
});
