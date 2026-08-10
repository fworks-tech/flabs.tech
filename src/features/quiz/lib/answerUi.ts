import type { QuizQuestion } from "@/features/quiz/data/questions";

/** Maps keyboard input (1–4 / A–D) to answer indexes — shared by the quiz and daily cards. */
export const KEY_INDICES: Record<string, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

export type AnswerState = "" | "correct" | "wrong" | "dimmed";

/**
 * Reveal state for an answer button once a pick is made: the correct one
 * is "correct", the wrong pick is "wrong", everything else is "dimmed".
 * Returns "" while the question is still unanswered.
 */
export function answerState(
  index: number,
  selectedIndex: number | null,
  question: QuizQuestion,
): AnswerState {
  if (selectedIndex === null) return "";
  if (index === question.correctIndex) return "correct";
  if (index === selectedIndex) return "wrong";
  return "dimmed";
}
