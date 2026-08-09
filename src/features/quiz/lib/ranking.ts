export const RANK_TITLES = ["Junior", "Mid-Level", "Senior", "Staff"] as const;
export type RankTitle = (typeof RANK_TITLES)[number];

/**
 * Maps an accuracy fraction (0–1) to a rank title.
 * Junior < 60%, Mid-Level < 75%, Senior < 90%, Staff >= 90%.
 */
export function rankFromAccuracy(accuracy: number): RankTitle {
  if (accuracy >= 0.9) return "Staff";
  if (accuracy >= 0.75) return "Senior";
  if (accuracy >= 0.6) return "Mid-Level";
  return "Junior";
}

export function rankFromScore(correct: number, total: number): RankTitle {
  return rankFromAccuracy(total === 0 ? 0 : correct / total);
}

/** Fun, run-specific copy shown next to the rank badge. */
export const RANK_COPY: Record<RankTitle, string> = {
  Junior: "You survived the sprint — barely.",
  "Mid-Level": "Solid fundamentals. The sprint liked you.",
  Senior: "Strong run. Zara would keep you on the team.",
  Staff: "Flawless fundamentals. Micro1 wants to meet you.",
};

export interface RankMeta {
  title: RankTitle;
  badge: string;
  copy: string;
}

export function rankMeta(correct: number, total: number): RankMeta {
  const title = rankFromScore(correct, total);
  return { title, badge: title, copy: RANK_COPY[title] };
}
