export const RANK_TITLES = ["Script Kiddie", "Code Monkey", "Bug Slayer", "Code Ninja", "JS Overlord"] as const;
export type RankTitle = (typeof RANK_TITLES)[number];

/**
 * Maps an accuracy fraction (0–1) to a rank title.
 * Script Kiddie < 50%, Code Monkey < 65%, Bug Slayer < 80%, Code Ninja < 90%, JS Overlord >= 90%.
 */
export function rankFromAccuracy(accuracy: number): RankTitle {
  if (accuracy >= 0.9) return "JS Overlord";
  if (accuracy >= 0.8) return "Code Ninja";
  if (accuracy >= 0.65) return "Bug Slayer";
  if (accuracy >= 0.5) return "Code Monkey";
  return "Script Kiddie";
}

export function rankFromScore(correct: number, total: number): RankTitle {
  return rankFromAccuracy(total === 0 ? 0 : correct / total);
}

/** Fun, run-specific copy shown next to the rank badge. */
export const RANK_COPY: Record<RankTitle, string> = {
  "Script Kiddie": "You copy-pasted your way through. We respect the hustle.",
  "Code Monkey": "Solid fundamentals. The console.log is strong with this one.",
  "Bug Slayer": "You hunt bugs like a pro. The stack trace fears you.",
  "Code Ninja": "Silent. Precise. Deadly. Your code compiles on the first try.",
  "JS Overlord": "You ARE the JavaScript. The spec was written about you.",
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
