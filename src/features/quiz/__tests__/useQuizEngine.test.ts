import { describe, expect, it } from "vitest";

import { buildDeck, seededShuffle, shuffleAnswers } from "@/features/quiz/data/questions";
import {
  MAX_LIVES,
  initialState,
  multiplierFor,
  quizReducer,
  type EngineState,
} from "@/features/quiz/hooks/useQuizEngine";

function runningState(overrides: Partial<Extract<EngineState, { phase: "running" }>> = {}) {
  return {
    phase: "running",
    deck: buildDeck(42),
    index: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    lives: MAX_LIVES,
    answers: [],
    startedAt: 1000,
    ...overrides,
  } as Extract<EngineState, { phase: "running" }>;
}

describe("quizReducer", () => {
  it("starts a game from idle", () => {
    const deck = buildDeck(42);
    const next = quizReducer(initialState(), { type: "start", deck, now: 1000 });
    expect(next.phase).toBe("running");
    if (next.phase !== "running") return;
    expect(next.deck).toBe(deck);
    expect(next.score).toBe(0);
    expect(next.lives).toBe(MAX_LIVES);
    expect(next.answers).toEqual([]);
  });

  it("ignores start when not idle", () => {
    const state = runningState();
    const next = quizReducer(state, { type: "start", deck: buildDeck(1), now: 2000 });
    expect(next).toBe(state);
  });

  it("awards 100 points on a correct answer and grows the streak", () => {
    const state = runningState({ streak: 0 });
    const q = state.deck[state.index];
    const next = quizReducer(state, { type: "answer", index: q.correctIndex, timeMs: 5000 });
    expect(next.phase).toBe("answered");
    if (next.phase !== "answered") return;
    expect(next.correct).toBe(true);
    expect(next.score).toBe(100);
    expect(next.streak).toBe(1);
    expect(next.maxStreak).toBe(1);
    expect(next.lives).toBe(MAX_LIVES);
    expect(next.answers).toHaveLength(1);
    expect(next.answers[0].correct).toBe(true);
  });

  it("multiplies points by the streak multiplier, capped at x5", () => {
    expect(multiplierFor(0)).toBe(1);
    expect(multiplierFor(2)).toBe(3);
    expect(multiplierFor(5)).toBe(5);
    expect(multiplierFor(99)).toBe(5);

    const state = runningState({ streak: 3, score: 1000 });
    const q = state.deck[state.index];
    const next = quizReducer(state, { type: "answer", index: q.correctIndex, timeMs: 3000 });
    if (next.phase !== "answered") return;
    expect(next.points).toBe(400);
    expect(next.score).toBe(1400);
  });

  it("loses a life and resets the streak on a wrong answer", () => {
    const state = runningState({ streak: 4, lives: 3 });
    const wrongIndex = (state.deck[state.index].correctIndex + 1) % 4;
    const next = quizReducer(state, { type: "answer", index: wrongIndex, timeMs: 3000 });
    if (next.phase !== "answered") return;
    expect(next.correct).toBe(false);
    expect(next.points).toBe(0);
    expect(next.lives).toBe(2);
    expect(next.streak).toBe(0);
  });

  it("treats a timeout as a wrong answer", () => {
    const state = runningState({ lives: 2 });
    const next = quizReducer(state, { type: "timeout" });
    if (next.phase !== "answered") return;
    expect(next.correct).toBe(false);
    expect(next.selectedIndex).toBe(-1);
    expect(next.lives).toBe(1);
    expect(next.streak).toBe(0);
    expect(next.answers[0].correct).toBe(false);
  });

  it("advances to the next question after answering", () => {
    const answered = quizReducer(runningState(), {
      type: "answer",
      index: 0,
      timeMs: 1000,
    });
    if (answered.phase !== "answered") return;
    const next = quizReducer(answered, { type: "advance", now: 2000 });
    expect(next.phase).toBe("running");
    if (next.phase !== "running") return;
    expect(next.index).toBe(1);
    expect(next.streak).toBe(answered.streak);
  });

  it("ends the game when the deck is exhausted", () => {
    const answered = quizReducer(
      runningState({ index: 19 }),
      { type: "answer", index: 0, timeMs: 1000 },
    );
    if (answered.phase !== "answered") return;
    const next = quizReducer(answered, { type: "advance", now: 60_000 });
    expect(next.phase).toBe("gameover");
    if (next.phase !== "gameover") return;
    expect(next.durationMs).toBe(59_000);
    expect(next.answers).toHaveLength(1);
  });

  it("ends the game when lives run out", () => {
    const answered = quizReducer(
      runningState({ lives: 1, index: 0 }),
      { type: "answer", index: 1, timeMs: 1000 },
    );
    if (answered.phase !== "answered") return;
    const next = quizReducer(answered, { type: "advance", now: 5000 });
    expect(next.phase).toBe("gameover");
    if (next.phase !== "gameover") return;
    expect(next.lives).toBe(0);
    expect(next.score).toBe(0);
  });

  it("ignores advance outside the answered phase", () => {
    const next = quizReducer(runningState(), { type: "advance", now: 5000 });
    expect(next.phase).toBe("running");
  });

  it("ignores answers outside the running phase", () => {
    const idle = quizReducer(initialState(), { type: "answer", index: 0, timeMs: 100 });
    expect(idle.phase).toBe("idle");
    const answered = quizReducer(runningState(), { type: "timeout" });
    const twice = quizReducer(answered, { type: "answer", index: 0, timeMs: 100 });
    if (answered.phase !== "answered") return;
    expect(twice).toBe(answered);
  });

  it("returns to idle on retry", () => {
    const answered = quizReducer(runningState(), { type: "timeout" });
    const next = quizReducer(answered, { type: "retry" });
    expect(next.phase).toBe("idle");
  });

  it("does not decrement lives on a timeout when already answered", () => {
    const answered = quizReducer(runningState(), { type: "answer", index: 0, timeMs: 500 });
    const timedOut = quizReducer(answered, { type: "timeout" });
    expect(timedOut).toBe(answered);
  });
});

describe("deck building", () => {
  it("deals 20 unique questions per run", () => {
    const deck = buildDeck(7);
    expect(deck).toHaveLength(20);
    expect(new Set(deck.map((q) => q.id)).size).toBe(20);
  });

  it("is deterministic for a given seed and different across seeds", () => {
    expect(buildDeck(7).map((q) => q.id)).toEqual(buildDeck(7).map((q) => q.id));
    expect(buildDeck(7).map((q) => q.id)).not.toEqual(buildDeck(8).map((q) => q.id));
  });

  it("keeps 4 shuffled answers with a valid correctIndex", () => {
    for (const q of buildDeck(3)) {
      expect(q.answers).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });

  it("shuffleAnswers recomputes correctIndex correctly", () => {
    const question = buildDeck(1)[0];
    const shuffled = shuffleAnswers(question, 999);
    expect(shuffled.answers).toHaveLength(4);
    expect(shuffled.answers[shuffled.correctIndex]).toBe(question.answers[question.correctIndex]);
  });

  it("seededShuffle keeps all elements", () => {
    const shuffled = seededShuffle([1, 2, 3, 4, 5], 5);
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
