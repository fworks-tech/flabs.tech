import { describe, expect, it } from "vitest";

import {
  MAX_DISPLAY_NAME,
  leaderboardMember,
  isoWeekKey,
  nextMondayEpochMs,
  parseMember,
  validateScorePayload,
  weeklyTtlSeconds,
} from "@/features/quiz/lib/leaderboard";

const valid = {
  displayName: "Zara",
  score: 3400,
  correct: 17,
  total: 20,
  maxStreak: 9,
  durationMs: 180_000,
};

describe("validateScorePayload", () => {
  it("accepts a valid payload", () => {
    expect(validateScorePayload(valid)).toEqual(valid);
  });

  it("rejects missing or non-object bodies", () => {
    expect(validateScorePayload(null)).toBeNull();
    expect(validateScorePayload(undefined)).toBeNull();
    expect(validateScorePayload("nope")).toBeNull();
    expect(validateScorePayload([])).toBeNull();
  });

  it("strips control chars, collapses whitespace and trims the name", () => {
    const payload = validateScorePayload({ ...valid, displayName: "  Za\u0000ra\t the \u007FBest " });
    expect(payload?.displayName).toBe("Zara the Best");
  });

  it("rejects an empty display name", () => {
    expect(validateScorePayload({ ...valid, displayName: "   " })).toBeNull();
    expect(validateScorePayload({ ...valid, displayName: "" })).toBeNull();
  });

  it("truncates the display name to 20 chars", () => {
    const payload = validateScorePayload({ ...valid, displayName: "x".repeat(50) });
    expect(payload?.displayName).toBe("x".repeat(MAX_DISPLAY_NAME));
  });

  it("rejects non-integer, negative or oversized scores", () => {
    expect(validateScorePayload({ ...valid, score: 1.5 })).toBeNull();
    expect(validateScorePayload({ ...valid, score: -1 })).toBeNull();
    expect(validateScorePayload({ ...valid, score: 10_001 })).toBeNull();
    expect(validateScorePayload({ ...valid, score: "3400" })).toBeNull();
  });

  it("rejects impossible correct/total combinations", () => {
    expect(validateScorePayload({ ...valid, correct: 21 })).toBeNull();
    expect(validateScorePayload({ ...valid, correct: -1 })).toBeNull();
    expect(validateScorePayload({ ...valid, total: 0 })).toBeNull();
    expect(validateScorePayload({ ...valid, total: 25 })).toBeNull();
    expect(validateScorePayload({ ...valid, correct: 21, total: 20 })).toBeNull();
  });

  it("rejects durations below the ~1s/question sanity floor", () => {
    expect(validateScorePayload({ ...valid, durationMs: 19_000 })).toBeNull();
    expect(validateScorePayload({ ...valid, durationMs: 20_000 })).not.toBeNull();
  });
});

describe("isoWeekKey", () => {
  it("produces Monday-based ISO week keys", () => {
    expect(isoWeekKey(new Date("2026-08-03T12:00:00Z"))).toBe("2026-W32");
    expect(isoWeekKey(new Date("2026-08-09T12:00:00Z"))).toBe("2026-W32");
    expect(isoWeekKey(new Date("2026-01-01T12:00:00Z"))).toBe("2026-W01");
  });

  it("keeps Monday and Sunday of the same week together", () => {
    expect(isoWeekKey(new Date("2026-08-03T00:00:00Z"))).toBe(
      isoWeekKey(new Date("2026-08-09T23:59:59Z")),
    );
  });
});

describe("nextMondayEpochMs / weeklyTtlSeconds", () => {
  it("rolls a Monday forward a full week", () => {
    const monday = new Date("2026-08-03T15:00:00Z");
    const next = new Date(nextMondayEpochMs(monday)).toISOString();
    expect(next).toBe("2026-08-10T00:00:00.000Z");
  });

  it("rolls a Sunday forward a single day", () => {
    const sunday = new Date("2026-08-09T12:00:00Z");
    const next = new Date(nextMondayEpochMs(sunday)).toISOString();
    expect(next).toBe("2026-08-10T00:00:00.000Z");
  });

  it("weeklyTtlSeconds is positive and within a week", () => {
    const ttl = weeklyTtlSeconds(new Date("2026-08-05T00:00:00Z"));
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(7 * 24 * 60 * 60);
  });
});

describe("leaderboardMember / parseMember", () => {
  it("round-trips a saved score", () => {
    const member = leaderboardMember(valid, "abc-123");
    const parsed = parseMember(member);
    expect(parsed).toMatchObject({
      id: "abc-123",
      displayName: "Zara",
      score: 3400,
      accuracy: 17 / 20,
      maxStreak: 9,
    });
    expect(parsed?.ts).toBeGreaterThan(0);
  });

  it("returns null for malformed members", () => {
    expect(parseMember("not json")).toBeNull();
    expect(parseMember('{"id":1}')).toBeNull();
    expect(parseMember(JSON.stringify({ id: "x", displayName: "y", score: "high" }))).toBeNull();
  });
});
