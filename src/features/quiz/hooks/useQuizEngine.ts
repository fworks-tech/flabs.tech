"use client";

import { useReducer } from "react";

import type { QuizQuestion } from "@/features/quiz/data/questions";

/** Cap on the streak multiplier so scores stay in the 0–10000 range. */
export const MAX_MULTIPLIER = 5;
export const MAX_LIVES = 3;
/** Time bonus (ms) granted per correct answer. */
export const TIME_BONUS_MS = 2000;

export interface AnswerRecord {
  questionId: string;
  correct: boolean;
  timeMs: number;
  points: number;
}

export type EngineState =
  | { phase: "idle" }
  | {
      phase: "running";
      deck: QuizQuestion[];
      index: number;
      score: number;
      streak: number;
      maxStreak: number;
      lives: number;
      answers: AnswerRecord[];
      startedAt: number;
    }
  | {
      phase: "answered";
      deck: QuizQuestion[];
      index: number;
      score: number;
      streak: number;
      maxStreak: number;
      lives: number;
      answers: AnswerRecord[];
      startedAt: number;
      selectedIndex: number;
      correct: boolean;
      timeMs: number;
      points: number;
    }
  | {
      phase: "gameover";
      deck: QuizQuestion[];
      score: number;
      streak: number;
      maxStreak: number;
      lives: number;
      answers: AnswerRecord[];
      durationMs: number;
    };

export type EngineAction =
  | { type: "start"; deck: QuizQuestion[]; now: number }
  | { type: "answer"; index: number; timeMs: number }
  | { type: "timeout" }
  | { type: "advance"; now: number }
  | { type: "retry" };

export function multiplierFor(streakBeforeAnswer: number): number {
  return Math.min(streakBeforeAnswer + 1, MAX_MULTIPLIER);
}

export function initialState(): EngineState {
  return { phase: "idle" };
}

export function isRunning(state: EngineState): boolean {
  return state.phase === "running";
}

export function isAnswered(state: EngineState): boolean {
  return state.phase === "answered";
}

export function gameOverStats(state: EngineState) {
  if (state.phase === "gameover") {
    const correctCount = state.answers.filter((a) => a.correct).length;
    return {
      score: state.score,
      maxStreak: state.maxStreak,
      livesLeft: state.lives,
      correctCount,
      total: state.deck.length,
      durationMs: state.durationMs,
      answers: state.answers,
    };
  }
  return null;
}

function answeredBase(
  state: Extract<EngineState, { phase: "running" }>,
  correct: boolean,
  selectedIndex: number,
  timeMs: number,
): Extract<EngineState, { phase: "answered" }> {
  const question = state.deck[state.index];
  const streakBefore = state.streak;
  const points = correct ? 100 * multiplierFor(streakBefore) : 0;
  return {
    ...state,
    phase: "answered",
    selectedIndex,
    correct,
    timeMs,
    points,
    score: state.score + points,
    streak: correct ? state.streak + 1 : 0,
    maxStreak: correct ? Math.max(state.maxStreak, state.streak + 1) : state.maxStreak,
    lives: correct ? state.lives : state.lives - 1,
    answers: [
      ...state.answers,
      { questionId: question.id, correct, timeMs, points },
    ],
  };
}

export function quizReducer(state: EngineState, action: EngineAction): EngineState {
  switch (action.type) {
    case "start":
      if (state.phase !== "idle") return state;
      return {
        phase: "running",
        deck: action.deck,
        index: 0,
        score: 0,
        streak: 0,
        maxStreak: 0,
        lives: MAX_LIVES,
        answers: [],
        startedAt: action.now,
      };

    case "answer":
      if (state.phase !== "running") return state;
      return answeredBase(
        state,
        state.deck[state.index].correctIndex === action.index,
        action.index,
        Math.max(0, action.timeMs),
      );

    case "timeout":
      if (state.phase !== "running") return state;
      return answeredBase(state, false, -1, 0);

    case "advance":
      if (state.phase !== "answered") return state;
      if (state.lives <= 0 || state.index + 1 >= state.deck.length) {
        return {
          phase: "gameover",
          deck: state.deck,
          score: state.score,
          streak: state.streak,
          maxStreak: state.maxStreak,
          lives: state.lives,
          answers: state.answers,
          durationMs: Math.max(0, action.now - state.startedAt),
        };
      }
      return { ...state, phase: "running", index: state.index + 1 };

    case "retry":
      return { phase: "idle" };

    default:
      return state;
  }
}

export function useQuizEngine() {
  return useReducer(quizReducer, undefined, initialState);
}
