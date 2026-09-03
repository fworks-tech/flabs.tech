import { randomUUID } from 'node:crypto';
import { store } from '@/lib/abuse/store';

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
  id: string;
  t: number;
  model: string;
  tokensIn: number;
  tokensOut: number;
  tier: string;
  blocked: boolean;
  injection: boolean;
  durationMs?: number;
  steps?: number;
  empty?: boolean;
  error?: string;
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
  severity: string;
  score: number;
  updatedAt?: number;
}

export interface QuarantineSummary {
  key: string;
  tier: string;
  reason: string;
  expiresAt: number;
}

function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Records one chat request (estimated input tokens; output corrected on completion). Returns the event id. */
export async function recordAiEvent(ev: Omit<AiEvent, 't' | 'id'>): Promise<string> {
  const day = dayKey();
  const statsKey = `admin:ai:stats:${day}`;
  const stats = (await store.get<Record<string, number>>(statsKey)) ?? {};
  stats.requests = (stats.requests ?? 0) + 1;
  stats.tokensIn = (stats.tokensIn ?? 0) + ev.tokensIn;
  stats.tokensOut = (stats.tokensOut ?? 0) + ev.tokensOut;
  if (ev.blocked) stats.blocked = (stats.blocked ?? 0) + 1;
  if (ev.injection) stats.injection = (stats.injection ?? 0) + 1;
  await store.set(statsKey, stats, { ex: AI_STATS_TTL });

  const id = randomUUID();
  const events = (await store.get<AiEvent[]>('admin:ai:events')) ?? [];
  events.push({ ...ev, id, t: Date.now() });
  await store.set('admin:ai:events', events.slice(-MAX_AI_EVENTS), { ex: AI_EVENTS_TTL });
  return id;
}

/** Adds actual output tokens once the stream completes (kept separate from estimates). */
export async function addAiTokensOut(tokens: number): Promise<void> {
  const statsKey = `admin:ai:stats:${dayKey()}`;
  const stats = (await store.get<Record<string, number>>(statsKey)) ?? {};
  stats.tokensOut = (stats.tokensOut ?? 0) + tokens;
  await store.set(statsKey, stats, { ex: AI_STATS_TTL });
}

/**
 * Patches the event with the given id with the actual output tokens once the
 * stream completes (events are recorded with `tokensOut: 0` before the
 * response is generated). Patching is per-request, so concurrent streams
 * never write their tokens onto a sibling request's row.
 *
 * No-op when the id is not found (list evicted, or the event was recorded
 * before events carried ids — those rows keep `tokensOut: 0` until the
 * 14-day list rolls over). Daily counters are corrected independently via
 * `addAiTokensOut`.
 */
export async function updateAiEventTokensOut(id: string, tokens: number): Promise<void> {
  const events = (await store.get<AiEvent[]>('admin:ai:events')) ?? [];
  const index = events.findIndex((ev) => ev.id === id);
  if (index === -1) return;
  events[index] = { ...events[index], tokensOut: tokens };
  await store.set('admin:ai:events', events, { ex: AI_EVENTS_TTL });
}

/** Records stream completion (duration, steps, empty flag, error). Never throws. */
export async function updateAiEventCompletion(
  id: string,
  completion: Partial<Pick<AiEvent, 'durationMs' | 'steps' | 'empty' | 'error' | 'tokensOut'>>,
): Promise<void> {
  try {
    const events = (await store.get<AiEvent[]>('admin:ai:events')) ?? [];
    const index = events.findIndex((ev) => ev.id === id);
    if (index === -1) return;
    events[index] = { ...events[index], ...completion };
    await store.set('admin:ai:events', events, { ex: AI_EVENTS_TTL });
  } catch {
    // Observability must never break the chat response.
  }
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
  const events = (await store.get<AiEvent[]>('admin:ai:events')) ?? [];
  return events.slice(-limit).reverse();
}

/** Abuse-pipeline state for the dashboard (keys are already masked by the pipeline). */
export async function getAbuseOverview(limit = 50): Promise<{
  cases: AbuseCaseSummary[];
  quarantines: QuarantineSummary[];
}> {
  const caseKeys = await store.keys('abuse:case:*');
  const quarantineKeys = await store.keys('abuse:quarantine:*');

  const cases: AbuseCaseSummary[] = [];
  for (const key of caseKeys) {
    const c = await store.get<{
      key?: string;
      score?: number;
      severity?: string;
      updatedAt?: number;
      signals?: { kind?: string; detail?: string; at?: number }[];
    }>(key);
    if (!c) continue;
    const lastSignal = c.signals?.[c.signals.length - 1];
    cases.push({
      key: key.replace('abuse:case:', ''),
      kind: lastSignal?.kind,
      detail: lastSignal?.detail,
      severity: c.severity ?? 'low',
      score: c.score ?? 0,
      updatedAt: c.updatedAt ?? lastSignal?.at,
    });
  }
  // `store.keys()` returns SCAN order — surface the most recently updated
  // cases first, then keep the top `limit`.
  cases.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.key.localeCompare(b.key));

  const quarantines: QuarantineSummary[] = [];
  for (const key of quarantineKeys.slice(-limit)) {
    const q = await store.get<{
      tier?: string;
      reason?: string;
      expiresAt?: number;
    }>(key);
    if (!q) continue;
    quarantines.push({
      key: key.replace('abuse:quarantine:', ''),
      tier: q.tier ?? 'unknown',
      reason: q.reason ?? '',
      expiresAt: q.expiresAt ?? 0,
    });
  }

  return { cases: cases.slice(0, limit), quarantines };
}
