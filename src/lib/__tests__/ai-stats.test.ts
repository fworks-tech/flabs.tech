import { beforeEach, describe, expect, it, vi } from 'vitest';

const storeMock = vi.hoisted(() => {
  const memory = new Map<string, string>();

  return {
    get: vi.fn(async <T = unknown>(key: string): Promise<T | null> => {
      const raw = memory.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }),
    set: vi.fn(async (key: string, value: unknown) => {
      memory.set(key, JSON.stringify(value));
    }),
    del: vi.fn(async (key: string) => {
      memory.delete(key);
    }),
    incr: vi.fn(async () => 1),
    keys: vi.fn(async (pattern: string) => {
      const regex = new RegExp(
        `^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
      );
      return Array.from(memory.keys()).filter((k) => regex.test(k));
    }),
    pfadd: vi.fn(async () => {}),
    pfcount: vi.fn(async () => 0),
    __clear: () => {
      memory.clear();
    },
  };
});

vi.mock('@/lib/abuse/store', () => ({ store: storeMock }));

beforeEach(() => {
  storeMock.__clear();
  storeMock.get.mockClear();
  storeMock.set.mockClear();
  storeMock.keys.mockClear();
});

describe('ai-stats', () => {
  it('records events into daily counters and the bounded list', async () => {
    const { recordAiEvent, getAiTotals, getRecentAiEvents } = await import('@/lib/ai-stats');

    await recordAiEvent({
      model: 'mimo-v2.5',
      tokensIn: 100,
      tokensOut: 50,
      tier: 'none',
      blocked: false,
      injection: true,
    });
    await recordAiEvent({
      model: 'mimo-v2.5',
      tokensIn: 200,
      tokensOut: 0,
      tier: 'throttle',
      blocked: true,
      injection: false,
    });

    const totals = await getAiTotals(1);
    expect(totals.requests).toBe(2);
    expect(totals.tokensIn).toBe(300);
    expect(totals.tokensOut).toBe(50);
    expect(totals.blocked).toBe(1);
    expect(totals.injection).toBe(1);

    const recent = await getRecentAiEvents();
    expect(recent).toHaveLength(2);
    expect(recent[0].tier).toBe('throttle');
    expect(recent[1].tier).toBe('none');
    expect(recent[1].injection).toBe(true);
  });

  it('addAiTokensOut corrects output totals after the stream completes', async () => {
    const { addAiTokensOut, getAiTotals } = await import('@/lib/ai-stats');

    await addAiTokensOut(123);
    const totals = await getAiTotals(1);
    expect(totals.tokensOut).toBe(123);
    expect(totals.requests).toBe(0);
  });

  it('updateAiEventTokensOut patches the event that matches the id', async () => {
    const { recordAiEvent, updateAiEventTokensOut, getRecentAiEvents } =
      await import('@/lib/ai-stats');

    const id = await recordAiEvent({
      model: 'mimo-v2.5',
      tokensIn: 100,
      tokensOut: 0,
      tier: 'none',
      blocked: false,
      injection: false,
    });

    expect(id).toEqual(expect.any(String));

    await updateAiEventTokensOut(id, 77);

    const recent = await getRecentAiEvents();
    expect(recent).toHaveLength(1);
    expect(recent[0].tokensOut).toBe(77);
    expect(recent[0].tokensIn).toBe(100);
  });

  it('updateAiEventTokensOut patches by id even when the event is not the latest', async () => {
    const { recordAiEvent, updateAiEventTokensOut, getRecentAiEvents } =
      await import('@/lib/ai-stats');

    const firstId = await recordAiEvent({
      model: 'mimo-v2.5',
      tokensIn: 100,
      tokensOut: 0,
      tier: 'none',
      blocked: false,
      injection: false,
    });
    await recordAiEvent({
      model: 'mimo-v2.5',
      tokensIn: 200,
      tokensOut: 0,
      tier: 'none',
      blocked: false,
      injection: false,
    });

    await updateAiEventTokensOut(firstId, 77);

    const recent = await getRecentAiEvents();
    expect(recent[0].tokensOut).toBe(0);
    expect(recent[1].tokensOut).toBe(77);
  });

  it('updateAiEventTokensOut is a no-op for unknown ids and empty lists', async () => {
    const { updateAiEventTokensOut } = await import('@/lib/ai-stats');

    await expect(updateAiEventTokensOut('missing-id', 42)).resolves.toBeUndefined();
  });

  it('updateAiEventTokensOut is a no-op for events recorded without an id', async () => {
    const { updateAiEventTokensOut, getRecentAiEvents } = await import('@/lib/ai-stats');

    await storeMock.set('admin:ai:events', [
      { id: undefined, t: Date.now(), model: 'mimo-v2.5', tokensIn: 10, tokensOut: 0, tier: 'none', blocked: false, injection: false },
    ]);

    await updateAiEventTokensOut('any-id', 42);

    const recent = await getRecentAiEvents();
    expect(recent[0].tokensOut).toBe(0);
  });

  it('getAiDaySeries returns empty days for missing data', async () => {
    const { getAiDaySeries } = await import('@/lib/ai-stats');

    const series = await getAiDaySeries(3);
    expect(series).toHaveLength(3);
    expect(series.every((d) => d.requests === 0 && d.tokensIn === 0)).toBe(true);
  });

  it('getAbuseOverview lists cases and quarantines', async () => {
    const { getAbuseOverview } = await import('@/lib/ai-stats');

    await storeMock.set('abuse:case:actor-1', {
      key: 'actor-1',
      score: 0.87,
      severity: 'high',
      updatedAt: 1_700_000_000_000,
      signals: [{ kind: 'injection', detail: 'prompt injection', at: 1_700_000_000_000 }],
    });
    await storeMock.set('abuse:quarantine:actor-1', {
      tier: 'soft-quarantine',
      reason: 'high severity',
      expiresAt: 1_700_000_100_000,
    });

    const overview = await getAbuseOverview();
    expect(overview.cases).toEqual([
      expect.objectContaining({
        key: 'actor-1',
        kind: 'injection',
        detail: 'prompt injection',
        severity: 'high',
        score: 0.87,
      }),
    ]);
    expect(overview.quarantines).toEqual([
      expect.objectContaining({
        key: 'actor-1',
        tier: 'soft-quarantine',
        reason: 'high severity',
      }),
    ]);
  });

  it('getAbuseOverview degrades gracefully for malformed case entries', async () => {
    const { getAbuseOverview } = await import('@/lib/ai-stats');

    await storeMock.set('abuse:case:ghost', { notACase: true });

    const overview = await getAbuseOverview();
    expect(overview.cases).toEqual([
      expect.objectContaining({ key: 'ghost', kind: undefined, severity: 'low', score: 0 }),
    ]);
  });

  it('getAbuseOverview returns cases most recently updated first', async () => {
    const { getAbuseOverview } = await import('@/lib/ai-stats');

    await storeMock.set('abuse:case:old', {
      key: 'old',
      score: 0.5,
      severity: 'medium',
      updatedAt: 1_700_000_000_000,
      signals: [{ kind: 'rate', detail: 'old', at: 1_700_000_000_000 }],
    });
    await storeMock.set('abuse:case:fresh', {
      key: 'fresh',
      score: 0.9,
      severity: 'high',
      updatedAt: 1_700_000_100_000,
      signals: [{ kind: 'injection', detail: 'new', at: 1_700_000_100_000 }],
    });

    const overview = await getAbuseOverview();
    expect(overview.cases.map((c) => c.key)).toEqual(['fresh', 'old']);
  });

  it('getAbuseOverview limits cases and quarantines to the limit', async () => {
    const { getAbuseOverview } = await import('@/lib/ai-stats');

    for (let i = 0; i < 3; i++) {
      await storeMock.set(`abuse:case:actor-${i}`, {
        key: `actor-${i}`,
        score: 0.1,
        severity: 'low',
        updatedAt: 1_700_000_000_000 + i,
        signals: [],
      });
      await storeMock.set(`abuse:quarantine:actor-${i}`, {
        tier: 'throttle',
        reason: 'r',
        expiresAt: 0,
      });
    }

    const overview = await getAbuseOverview(2);
    expect(overview.cases.map((c) => c.key)).toEqual(['actor-2', 'actor-1']);
    expect(overview.quarantines.map((q) => q.key)).toEqual(['actor-1', 'actor-2']);
  });
});
