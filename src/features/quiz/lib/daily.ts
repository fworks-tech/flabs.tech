export interface DailyAttempt {
  /** UTC day key (YYYY-MM-DD) — matches `dailyQuestion`'s day boundary. */
  date: string;
  questionId: string;
  selectedIndex: number;
  correct: boolean;
}

const HISTORY_KEY = 'devsprint.dailyHistory';
/** Keep ~3 months of history — enough for streaks + last result. */
const HISTORY_LIMIT = 90;

/** UTC day key, aligned with `dailyQuestion` so the prompt and the lock flip together. */
export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Moves a YYYY-MM-DD key by `deltaDays` (UTC-safe, handles month/year rollover). */
export function shiftDate(dayKey: string, deltaDays: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + deltaDays)).toISOString().slice(0, 10);
}

export function loadDailyHistory(): DailyAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DailyAttempt[]) : [];
  } catch {
    return [];
  }
}

/** Records one attempt per day (replaces that day's entry), newest last. */
export function saveDailyAttempt(attempt: DailyAttempt): DailyAttempt[] {
  const history = [...loadDailyHistory().filter((a) => a.date !== attempt.date), attempt]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-HISTORY_LIMIT);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore quota / private-mode failures
  }
  return history;
}

/**
 * Consecutive CORRECT days ending today — or ending yesterday when today
 * is still unplayed, so a streak is visible (and at stake) before answering.
 */
export function computeDailyStreak(history: DailyAttempt[], today = todayKey()): number {
  let cursor = today;
  if (!history.some((a) => a.date === today)) {
    cursor = shiftDate(today, -1);
  }
  let streak = 0;
  for (;;) {
    const attempt = history.find((a) => a.date === cursor);
    if (!attempt || !attempt.correct) break;
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}
