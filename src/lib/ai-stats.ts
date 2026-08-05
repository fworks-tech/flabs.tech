import { store } from "@/lib/abuse/store";

/**
 * Server-side storage for the AI assistant dashboard.
 *
 * Namespace: `admin:ai:*` (separate from `abuse:*` and `analytics:*`).
 * - `admin:ai:stats:<day>` — JSON map of daily request/token counters (30d TTL)
 * - `admin:ai:events`      — bounded list of recent chat requests (14d TTL)
 */

export const AI_STATS_TTL = 30 * 24 * 60 * 60;
export const AI_EVENTS_TTL = 14 * 24 * 60 * 60;
export const MAX_AI_EVENTS = 500;

export interface AiEvent {
  t: number;
  model: string;
  tokensIn: number;
  tokensOut: number;
  tier: string;
  blocked: boolean;
  injection: boolean;
}

export interface AiDayStats {
  day: string;
  requests: number;
  tokensIn: number;
  tokensOut: number;
  blocked: number;
  injection: number;
}

export interface AbuseCaseSummary {
  key: string;
  kind?: string;
  detail?: string;
  at?: number;
}

function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Records one chat request (estimated input tokens; output corrected on completion). */
export async function recordAiEvent(ev: Omit<AiEvent, "t">): Promise<void> {
  const day = dayKey();
  const statsKey = `admin:ai:stats:${day}`;
  const stats = (await store.get<Record<string, number>>(statsKey)) ?? {};
  stats.requests = (stats.requests ?? 0) + 1;
  stats.tokensIn = (stats.tokensIn ?? 0) + ev.tokensIn;
  stats.tokensOut = (stats.tokensOut ?? 0) + ev.tokensOut;
  if (ev.blocked) stats.blocked = (stats.blocked ?? 0) + 1;
  if (ev.injection) stats.injection = (stats.injection ?? 0) + 1;
  await store.set(statsKey, stats, { ex: AI_STATS_TTL });

  const events = (await store.get<AiEvent[]>("admin:ai:events")) ?? [];
  events.push({ ...ev, t: Date.now() });
  await store.set("admin:ai:events", events.slice(-MAX_AI_EVENTS), { ex: AI_EVENTS_TTL });
}

/** Adds actual output tokens once the stream completes (kept separate from estimates). */
export async function addAiTokensOut(tokens: number): Promise<void> {
  const statsKey = `admin:ai:stats:${dayKey()}`;
  const stats = (await store.get<Record<string, number>>(statsKey)) ?? {};
  stats.tokensOut = (stats.tokensOut ?? 0) + tokens;
  await store.set(statsKey, stats, { ex: AI_STATS_TTL });
}

export async function getAiDaySeries(days: number): Promise<AiDayStats[]> {
  const out: AiDayStats[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const day = dayKey(d);
    const stats = (await store.get<Record<string, number>>(`admin:ai:stats:${day}`)) ?? {};
    out.push({
      day,
      requests: stats.requests ?? 0,
      tokensIn: stats.tokensIn ?? 0,
      tokensOut: stats.tokensOut ?? 0,
      blocked: stats.blocked ?? 0,
      injection: stats.injection ?? 0,
    });
  }
  return out;
}

export async function getAiTotals(days: number): Promise<{
  requests: number;
  tokensIn: number;
  tokensOut: number;
  blocked: number;
  injection: number;
}> {
  const totals = { requests: 0, tokensIn: 0, tokensOut: 0, blocked: 0, injection: 0 };
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayKey(new Date(now - i * 24 * 60 * 60 * 1000));
    const stats = (await store.get<Record<string, number>>(`admin:ai:stats:${day}`)) ?? {};
    totals.requests += stats.requests ?? 0;
    totals.tokensIn += stats.tokensIn ?? 0;
    totals.tokensOut += stats.tokensOut ?? 0;
    totals.blocked += stats.blocked ?? 0;
    totals.injection += stats.injection ?? 0;
  }
  return totals;
}

export async function getRecentAiEvents(limit = 30): Promise<AiEvent[]> {
  const events = (await store.get<AiEvent[]>("admin:ai:events")) ?? [];
  return events.slice(-limit).reverse();
}

/** Abuse-pipeline state for the dashboard (keys are already masked by the pipeline). */
export async function getAbuseOverview(limit = 50): Promise<{
  cases: AbuseCaseSummary[];
  quarantines: string[];
}> {
  const caseKeys = await store.keys("abuse:case:*");
  const quarantineKeys = await store.keys("abuse:quarantine:*");

  const cases: AbuseCaseSummary[] = [];
  for (const key of caseKeys.slice(-limit)) {
    const c = await store.get<{ kind?: string; detail?: string; at?: number }>(key);
    cases.push({
      key: key.replace("abuse:case:", ""),
      kind: c?.kind,
      detail: c?.detail,
      at: c?.at,
    });
  }

  return {
    cases,
    quarantines: quarantineKeys.map((key) => key.replace("abuse:quarantine:", "")),
  };
}
