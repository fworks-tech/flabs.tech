import { store } from '@/lib/abuse/store';

/**
 * Server-side storage for the self-hosted, consent-first UX analytics.
 *
 * Namespace: `analytics:*` (separate from `abuse:*`).
 * - `analytics:counters:<day>`  — JSON map of daily totals (30d TTL)
 * - `analytics:pages:<day>`     — JSON map path -> pageview count, capped at 100 (30d TTL)
 * - `analytics:uv:<day>`        — HyperLogLog of unique visitor ids (30d TTL)
 * - `analytics:seen:<uid>`      — marker for new-vs-returning detection (90d TTL)
 * - `analytics:events`          — bounded list of recent raw events (14d TTL)
 */

export const ANALYTICS_TTL = 30 * 24 * 60 * 60;
export const SEEN_TTL = 90 * 24 * 60 * 60;
export const EVENTS_TTL = 14 * 24 * 60 * 60;
export const MAX_RECENT_EVENTS = 1000;
export const MAX_PAGES = 100;

/** Event types accepted by the ingest endpoint. Single source of truth for
 *  the self-hosted analytics taxonomy — the client `EventName` union and the
 *  ingest validation both derive from this list. */
export const EVENT_TYPES = [
  'session_start',
  'page_view',
  'scroll_depth',
  'nav_click',
  'external_link',
  'cta_click',
  'project_view',
  'post_click',
  'social_link',
  'ai_assistant_open',
  'ai_assistant_close',
  'ai_assistant_send',
  'ai_assistant_error',
  'ai_assistant_generation_stopped',
  'ai_assistant_timeout',
  'ai_assistant_retry',
  'protected_route_access_granted',
  'consent_accepted',
  'consent_declined',
  'quiz_start',
  'quiz_answer',
  'quiz_complete',
  'quiz_daily_answer',
  'quiz_score_saved',
  'quiz_feedback_submit',
  'quiz_rating_submit',
  'quiz_referral_cta_shown',
  'quiz_referral_click',
  'quiz_share',
] as const;

export type EventName = (typeof EVENT_TYPES)[number];

/** Lookup set for O(1) ingest validation. */
export const EVENT_TYPES_SET: ReadonlySet<string> = new Set(EVENT_TYPES);
export interface TrackedEvent {
  t: number;
  ty: string;
  p?: string;
  uid?: string;
  sid?: string;
  d?: string;
  b?: string;
  r?: string;
  v?: number;
  l?: string;
}

export function dayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

async function bumpCounter(key: string, field: string, ttlSeconds: number): Promise<void> {
  const data = (await store.get<Record<string, number>>(key)) ?? {};
  data[field] = (data[field] ?? 0) + 1;
  await store.set(key, data, { ex: ttlSeconds });
}

async function bumpPage(key: string, path: string, ttlSeconds: number): Promise<void> {
  const data = (await store.get<Record<string, number>>(key)) ?? {};
  if (!(path in data) && Object.keys(data).length >= MAX_PAGES) {
    const lowest = Object.entries(data).sort((a, b) => a[1] - b[1])[0];
    if (lowest) delete data[lowest[0]];
  }
  data[path] = (data[path] ?? 0) + 1;
  await store.set(key, data, { ex: ttlSeconds });
}

/** Persists a validated analytics event (aggregates + bounded raw list). */
export async function recordEvent(ev: TrackedEvent): Promise<void> {
  const day = dayKey(new Date(ev.t));
  const countersKey = `analytics:counters:${day}`;
  const ttl = ANALYTICS_TTL;

  await bumpCounter(countersKey, ev.ty, ttl);
  if (ev.d) await bumpCounter(countersKey, `device:${ev.d}`, ttl);
  if (ev.b) await bumpCounter(countersKey, `browser:${ev.b}`, ttl);

  if (ev.ty === 'page_view' && ev.p) {
    await bumpPage(`analytics:pages:${day}`, ev.p, ttl);
  }

  // Scroll milestones arrive as one event per threshold; the funnel needs them
  // split per threshold, so mirror them into `scroll:<pct>` counters.
  // Only record known thresholds to avoid arbitrary keys from malformed events.
  const thresholds = SCROLL_THRESHOLDS as readonly number[];
  if (ev.ty === 'scroll_depth' && typeof ev.v === 'number' && thresholds.includes(ev.v)) {
    await bumpCounter(countersKey, `scroll:${ev.v}`, ttl);
  }

  if (ev.ty === 'session_start' && ev.uid) {
    await store.pfadd(`analytics:uv:${day}`, ev.uid);
    const seenKey = `analytics:seen:${ev.uid}`;
    const seen = await store.get<number>(seenKey);
    if (seen) {
      await bumpCounter(countersKey, 'returning_visitors', ttl);
    } else {
      await bumpCounter(countersKey, 'new_visitors', ttl);
      await store.set(seenKey, 1, { ex: SEEN_TTL });
    }
  }

  const events = (await store.get<TrackedEvent[]>('analytics:events')) ?? [];
  events.push(ev);
  await store.set('analytics:events', events.slice(-MAX_RECENT_EVENTS), { ex: EVENTS_TTL });
}

export async function getRecentEvents(limit = 50): Promise<TrackedEvent[]> {
  const events = (await store.get<TrackedEvent[]>('analytics:events')) ?? [];
  return events.slice(-limit).reverse();
}

/** Aggregated daily stats for the last `days` days (oldest first). */
export async function getDaySeries(days: number): Promise<
  {
    day: string;
    pageviews: number;
    sessions: number;
    uniques: number;
    clicks: number;
    chatMessages: number;
  }[]
> {
  const out = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const day = dayKey(d);
    const counters = (await store.get<Record<string, number>>(`analytics:counters:${day}`)) ?? {};
    const uniques = await store.pfcount(`analytics:uv:${day}`);
    out.push({
      day,
      pageviews: counters.page_view ?? 0,
      sessions: counters.session_start ?? 0,
      uniques,
      clicks:
        (counters.nav_click ?? 0) +
        (counters.external_link ?? 0) +
        (counters.cta_click ?? 0) +
        (counters.social_link ?? 0),
      chatMessages: counters.ai_assistant_send ?? 0,
    });
  }
  return out;
}

export async function getTopPages(days: number, limit = 10): Promise<[string, number][]> {
  const merged: Record<string, number> = {};
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const pages = (await store.get<Record<string, number>>(`analytics:pages:${dayKey(d)}`)) ?? {};
    for (const [path, count] of Object.entries(pages)) {
      merged[path] = (merged[path] ?? 0) + count;
    }
  }
  return Object.entries(merged)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export async function getTotals(days: number): Promise<{
  pageviews: number;
  sessions: number;
  uniques: number;
  newVisitors: number;
  returningVisitors: number;
  clicks: number;
  devices: Record<string, number>;
  browsers: Record<string, number>;
}> {
  const totals = {
    pageviews: 0,
    sessions: 0,
    uniques: 0,
    newVisitors: 0,
    returningVisitors: 0,
    clicks: 0,
    devices: {} as Record<string, number>,
    browsers: {} as Record<string, number>,
  };
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const day = dayKey(d);
    const counters = (await store.get<Record<string, number>>(`analytics:counters:${day}`)) ?? {};
    totals.pageviews += counters.page_view ?? 0;
    totals.sessions += counters.session_start ?? 0;
    totals.newVisitors += counters.new_visitors ?? 0;
    totals.returningVisitors += counters.returning_visitors ?? 0;
    totals.clicks +=
      (counters.nav_click ?? 0) +
      (counters.external_link ?? 0) +
      (counters.cta_click ?? 0) +
      (counters.social_link ?? 0);
    for (const key of ['mobile', 'tablet', 'desktop']) {
      const n = counters[`device:${key}`] ?? 0;
      if (n > 0) totals.devices[key] = (totals.devices[key] ?? 0) + n;
    }
    for (const key of BROWSER_KEYS) {
      const n = counters[`browser:${key}`] ?? 0;
      if (n > 0) totals.browsers[key] = (totals.browsers[key] ?? 0) + n;
    }
    totals.uniques += await store.pfcount(`analytics:uv:${day}`);
  }
  return totals;
}

/** Shared keys for browser counters — kept in sync with `detectEnvironment` in `tracking.ts`. */
export const BROWSER_KEYS = ['chrome', 'firefox', 'safari', 'edge', 'other'] as const;

/** Scroll depth thresholds emitted by `usePageTracking`. */
export const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * The signal already collected but never displayed: browser split (mirrored
 * into `getTotals` for the existing cards) plus the scroll and quiz funnels.
 * Reads the same daily counters — no new collection, no new keys to migrate.
 */
export async function getEngagement(days: number): Promise<{
  browsers: Record<string, number>;
  scrollDepth: { [K in (typeof SCROLL_THRESHOLDS)[number]]: number };
  quiz: { starts: number; completes: number };
}> {
  const out = {
    browsers: {} as Record<string, number>,
    scrollDepth: Object.fromEntries(SCROLL_THRESHOLDS.map((t) => [t, 0])) as { [K in (typeof SCROLL_THRESHOLDS)[number]]: number },
    quiz: { starts: 0, completes: 0 },
  };
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const day = dayKey(new Date(now - i * 24 * 60 * 60 * 1000));
    const counters = (await store.get<Record<string, number>>(`analytics:counters:${day}`)) ?? {};
    for (const key of BROWSER_KEYS) {
      const n = counters[`browser:${key}`] ?? 0;
      if (n > 0) out.browsers[key] = (out.browsers[key] ?? 0) + n;
    }
    for (const threshold of SCROLL_THRESHOLDS) {
      out.scrollDepth[threshold] = (out.scrollDepth[threshold] ?? 0) + (counters[`scroll:${threshold}`] ?? 0);
    }
    out.quiz.starts += counters.quiz_start ?? 0;
    out.quiz.completes += counters.quiz_complete ?? 0;
  }
  return out;
}
