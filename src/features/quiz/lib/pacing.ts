/** Quick auto-advance after a correct answer — keeps the arcade pace. */
export const CORRECT_FEEDBACK_MS = 1200;
/**
 * Learning pause after a wrong answer: hold the feedback (text + code
 * snippet) for up to 15s so players can study the mistake, or let them
 * click "Next" to advance sooner.
 */
export const WRONG_FEEDBACK_MS = 15000;

/** Feedback hold before auto-advancing to the next question. */
export function feedbackDelayMs(correct: boolean): number {
  return correct ? CORRECT_FEEDBACK_MS : WRONG_FEEDBACK_MS;
}
