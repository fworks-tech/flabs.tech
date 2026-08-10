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

  it('updateAiEventTokensOut patches the last event after the stream completes', async () => {
    const { recordAiEvent, updateAiEventTokensOut, getRecentAiEvents } =
      await import('@/lib/ai-stats');

    await recordAiEvent({
      model: 'mimo-v2.5',
      tokensIn: 100,
      tokensOut: 0,
      tier: 'none',
      blocked: false,
      injection: false,
    });

    await updateAiEventTokensOut(77);

    const recent = await getRecentAiEvents();
    expect(recent).toHaveLength(1);
    expect(recent[0].tokensOut).toBe(77);
    expect(recent[0].tokensIn).toBe(100);
  });

  it('updateAiEventTokensOut is a no-op when no events exist', async () => {
    const { updateAiEventTokensOut } = await import('@/lib/ai-stats');

    await expect(updateAiEventTokensOut(42)).resolves.toBeUndefined();
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
});
