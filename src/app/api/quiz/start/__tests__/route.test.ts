import { describe, expect, it, vi, beforeEach } from 'vitest';

const storeMock = vi.hoisted(() => ({
  incr: vi.fn(async () => 1),
  set: vi.fn(async () => undefined),
}));

vi.mock('@/lib/abuse/store', () => ({ store: storeMock }));

import { POST } from '../route';

function request(ip = '1.2.3.4') {
  return new Request('http://localhost/api/quiz/start', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('POST /api/quiz/start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.incr.mockResolvedValue(1);
  });

  it('issues a run id and a seed and stores the seed server-side', async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    const data = (await res.json()) as { runId: string; seed: number };

    expect(data.runId).toBeTypeOf('string');
    expect(Number.isInteger(data.seed)).toBe(true);
    expect(data.seed).toBeGreaterThanOrEqual(0);
    expect(data.seed).toBeLessThan(2 ** 31);

    expect(storeMock.set).toHaveBeenCalledWith(
      `quiz:run:${data.runId}`,
      expect.objectContaining({ seed: data.seed, issuedAt: expect.any(Number) }),
      { ex: 30 * 60 },
    );
  });

  it('rate limits per IP', async () => {
    storeMock.incr.mockResolvedValue(21);
    const res = await POST(request('9.9.9.9'));
    expect(res.status).toBe(429);
    expect(storeMock.set).not.toHaveBeenCalled();
    expect(storeMock.incr).toHaveBeenCalledWith('quiz:rl:quiz-start:9.9.9.9', 60);
  });
});
