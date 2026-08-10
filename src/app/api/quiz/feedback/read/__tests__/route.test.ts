import { describe, expect, it, vi, beforeEach } from 'vitest';

const storeMock = vi.hoisted(() => {
  const memory = new Map<string, string>();

  return {
    incr: vi.fn(async () => 1),
    get: vi.fn(async <T = unknown>(key: string): Promise<T | null> => {
      const raw = memory.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }),
    set: vi.fn(async (key: string, value: unknown) => {
      memory.set(key, JSON.stringify(value));
    }),
    keys: vi.fn(async () => []),
    __clear: () => {
      memory.clear();
    },
  };
});

vi.mock('@/lib/abuse/store', () => ({ store: storeMock }));

import { POST } from '../route';

function request(body: unknown, ip = '1.2.3.4') {
  return new Request('http://localhost/api/quiz/feedback/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

const REAL_IDS = ['fb-1', 'fb-2', 'fb-3'];

beforeEach(() => {
  vi.clearAllMocks();
  storeMock.__clear();
  storeMock.incr.mockResolvedValue(1);
  storeMock.set.mockImplementation(async (key: string, value: unknown) => {
    // no-op; assertions inspect call args
  });
  storeMock.get.mockImplementation(async <T = unknown>(key: string): Promise<T | null> => {
    if (key === 'quiz:feedback') {
      return REAL_IDS.map((id) => ({ id, questionId: 'q1', reason: 'typo', message: '', at: 0, uid: 'u' })) as T;
    }
    return null;
  });
});

describe('POST /api/quiz/feedback/read', () => {
  it('marks a single feedback entry as read with a TTL', async () => {
    const res = await POST(request({ id: 'fb-1' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, count: 1 });

    const [key, value, opts] = storeMock.set.mock.calls[0] as unknown[];
    expect(key).toBe('quiz:feedback:read:fb-1');
    expect(value).toBe(true);
    expect(opts).toEqual({ ex: 30 * 24 * 60 * 60 });
  });

  it('marks multiple entries as read and reports the deduped count', async () => {
    const res = await POST(request({ ids: ['fb-1', 'fb-2', 'fb-1'] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, count: 2 });

    const marked = (storeMock.set.mock.calls as unknown as string[][]).map((c) => c[0]);
    expect(marked).toEqual(['quiz:feedback:read:fb-1', 'quiz:feedback:read:fb-2']);
  });

  it.each([
    ['empty ids array', { ids: [] }],
    ['missing both forms', {}],
    ['non-string id', { id: 42 }],
    ['non-string members in ids', { ids: ['fb-1', 42] }],
    ['ids not an array', { ids: 'fb-1' }],
    ['both id and ids', { id: 'fb-1', ids: ['fb-2'] }],
    ['too many ids', { ids: Array.from({ length: 501 }, (_, i) => `fb-${i}`) }],
    ['empty id', { id: '' }],
    ['overlong id', { id: 'x'.repeat(65) }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect(storeMock.set).not.toHaveBeenCalled();
  });

  it('drops unknown ids and marks only existing entries', async () => {
    const res = await POST(request({ ids: ['fb-1', 'nope', 'fb-2'] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, count: 2 });
    expect(storeMock.set.mock.calls.map((c) => c[0])).toEqual([
      'quiz:feedback:read:fb-1',
      'quiz:feedback:read:fb-2',
    ]);
  });

  it('rejects when no target exists in the feedback list', async () => {
    const res = await POST(request({ ids: ['nope-1', 'nope-2'] }));
    expect(res.status).toBe(400);
    expect(storeMock.set).not.toHaveBeenCalled();
  });

  it('returns 429 with Retry-After when rate limited', async () => {
    storeMock.incr.mockResolvedValue(31);
    const res = await POST(request({ id: 'fb-1' }));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    expect(storeMock.set).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/quiz/feedback/read', { method: 'POST', body: '{bad' }),
    );
    expect(res.status).toBe(400);
  });

  it('keys the rate limit by the rightmost X-Forwarded-For entry', async () => {
    await POST(request({ id: 'fb-1' }, '1.1.1.1, 2.2.2.2'));
    expect(storeMock.incr.mock.calls[0][0]).toBe('quiz:rl:fb-read:2.2.2.2');
  });
});
