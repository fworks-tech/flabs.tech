/**
 * Pure quiz scoring rules, shared by the client engine and the score API.
 *
 * The server replays a run with these helpers, so the engine and the
 * leaderboard can never disagree about how a score is computed.
 */

/** Cap on the streak multiplier so scores stay in the 0–10000 range. */
export const MAX_MULTIPLIER = 5;
/** Time bonus (ms) granted per correct answer. */
export const TIME_BONUS_MS = 2000;

export function multiplierFor(streakBeforeAnswer: number): number {
  return Math.min(streakBeforeAnswer + 1, MAX_MULTIPLIER);
}

export interface AnswerScore {
  score: number;
  correct: number;
  total: number;
  maxStreak: number;
}

/**
 * Replays a deck against the picked answer indexes.
 * A pick of `-1` (timeout) never matches a real `correctIndex`.
 */
export function scoreAnswers(
  deck: readonly { correctIndex: number }[],
  picks: readonly number[],
): AnswerScore {
  let score = 0;
  let correct = 0;
  let streak = 0;
  let maxStreak = 0;

  for (let i = 0; i < picks.length; i++) {
    const question = deck[i];
    if (!question) break;
    if (question.correctIndex === picks[i]) {
      score += 100 * multiplierFor(streak);
      streak += 1;
      correct += 1;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 0;
    }
  }

  return { score, correct, total: deck.length, maxStreak };
}
