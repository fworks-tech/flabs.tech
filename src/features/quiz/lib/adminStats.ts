import { store } from "@/lib/abuse/store";
import { isFeedbackRead, listFeedback } from "./feedback";
import { getRatingsAggregate, getReferralClicks } from "./ratings";

export interface QuizAdminOverview {
  feedback: { item: Awaited<ReturnType<typeof listFeedback>>[number]; read: boolean }[];
  attempts: number;
  feedbackTotal: number;
  readFeedback: number;
  ratings: { up: number; down: number } | null;
  referralClicks: number;
}

/**
 * Aggregates quiz state for `/admin/quiz`. Uses the bounded `keys()`
 * pattern (tiny, TTL-bounded key space — same as `getAbuseOverview`).
 */
export async function getQuizOverview(): Promise<QuizAdminOverview> {
  const [attemptKeys, feedback, ratings, referralClicks] = await Promise.all([
    store.keys("quiz:attempt:*"),
    listFeedback(),
    getRatingsAggregate(),
    getReferralClicks(),
  ]);

  const readChecks = await Promise.all(feedback.map((item) => isFeedbackRead(item.id)));
  const withRead = feedback.map((item, index) => ({ item, read: readChecks[index] }));

  return {
    feedback: withRead,
    attempts: attemptKeys.length,
    feedbackTotal: feedback.length,
    readFeedback: withRead.filter((f) => f.read).length,
    ratings,
    referralClicks,
  };
}
