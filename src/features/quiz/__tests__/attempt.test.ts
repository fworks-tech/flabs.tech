import { describe, expect, it } from "vitest";

import { validateAttemptPayload } from "@/features/quiz/lib/attempt";

const valid = {
  attemptId: "attempt-1",
  answers: [
    { questionId: "event-loop-order", correct: true, timeMs: 4200 },
    { questionId: "tdz", correct: false, timeMs: 15000 },
  ],
  durationMs: 120_000,
};

describe("validateAttemptPayload", () => {
  it("accepts a valid attempt", () => {
    expect(validateAttemptPayload(valid)).toEqual(valid);
  });

  it("accepts an empty answers list", () => {
    expect(validateAttemptPayload({ ...valid, answers: [] })).toEqual({
      ...valid,
      answers: [],
    });
  });

  it("rejects missing attemptId or junk bodies", () => {
    expect(validateAttemptPayload({ answers: [], durationMs: 1 })).toBeNull();
    expect(validateAttemptPayload(null)).toBeNull();
  });

  it("rejects more than 20 answers", () => {
    const answers = Array.from({ length: 21 }, () => ({
      questionId: "q",
      correct: true,
      timeMs: 1000,
    }));
    expect(validateAttemptPayload({ ...valid, answers })).toBeNull();
  });

  it("rejects malformed answer entries", () => {
    expect(
      validateAttemptPayload({ ...valid, answers: [{ questionId: "q", correct: "yes", timeMs: 1 }] }),
    ).toBeNull();
    expect(
      validateAttemptPayload({ ...valid, answers: [{ questionId: "", correct: true, timeMs: 1 }] }),
    ).toBeNull();
    expect(
      validateAttemptPayload({ ...valid, answers: [{ questionId: "q", correct: true, timeMs: -1 }] }),
    ).toBeNull();
    expect(
      validateAttemptPayload({ ...valid, answers: [{ questionId: "q", correct: true, timeMs: 99_000 }] }),
    ).toBeNull();
  });

  it("rejects negative durations", () => {
    expect(validateAttemptPayload({ ...valid, durationMs: -5 })).toBeNull();
  });
});
