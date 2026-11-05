import { describe, expect, it, vi, beforeEach } from 'vitest';

import { buildDeck } from '@/features/quiz/data/questions';

const storeMock = vi.hoisted(() => ({
  incr: vi.fn(async () => 1),
  getdel: vi.fn(async () => null),
  zadd: vi.fn(async () => undefined),
  zremrangebyrank: vi.fn(async () => 0),
  set: vi.fn(async () => undefined),
  zrevrank: vi.fn(async () => 0),
}));

vi.mock('@/lib/abuse/store', () => ({ store: storeMock }));

import { POST } from '../route';

const deck = buildDeck(42);
// Picking the correct index for the first three questions yields 100 + 200 + 300.
const correctPicks = deck.slice(0, 3).map((question) => question.correctIndex);

const validBody = {
  displayName: 'Zara',
  runId: 'run-1',
  answers: correctPicks,
  durationMs: 10_000,
};

function request(body: unknown) {
  return new Request('http://localhost/api/quiz/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/quiz/score', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMock.incr.mockResolvedValue(1);
    storeMock.getdel.mockResolvedValue({ seed: 42, issuedAt: Date.now() });
    storeMock.zrevrank.mockResolvedValue(0);
  });

  it('replays the run and saves the derived score to both leaderboards', async () => {
    const res = await POST(request(validBody));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.saved).toBe(true);
    expect(data.id).toBeTypeOf('string');
    expect(data.rank).toBe(0);

    expect(storeMock.getdel).toHaveBeenCalledWith('quiz:run:run-1');
    expect(storeMock.zadd).toHaveBeenCalledWith(
      'quiz:leaderboard',
      600,
      expect.stringContaining('Zara'),
    );
    expect(storeMock.zadd).toHaveBeenCalledWith(
      expect.stringMatching(/^quiz:leaderboard:\d{4}-W\d{2}$/),
      600,
      expect.any(String),
      expect.any(Number),
    );
    // Keep the highest `TOP_N` ranks; ranks ascend from the lowest score.
    expect(storeMock.zremrangebyrank).toHaveBeenCalledWith('quiz:leaderboard', 0, -101);
    expect(storeMock.set).toHaveBeenCalledWith(
      `quiz:attempt:${data.id}`,
      expect.objectContaining({ displayName: 'Zara', score: 600, correct: 3, total: 20 }),
      { ex: 7 * 24 * 60 * 60 },
    );
  });

  it('rejects an unknown or already-consumed run', async () => {
    storeMock.getdel.mockResolvedValue(null);
    const res = await POST(request(validBody));
    expect(res.status).toBe(400);
    expect(storeMock.zadd).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/quiz/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not json',
      }),
    );
    expect(res.status).toBe(400);
    expect(storeMock.zadd).not.toHaveBeenCalled();
  });

  it.each([
    ['empty name', { ...validBody, displayName: '  ' }],
    ['missing run id', { ...validBody, runId: '' }],
    ['too many answers', { ...validBody, answers: Array.from({ length: 21 }, () => 0) }],
    ['impossible pick', { ...validBody, answers: [0, 1, 4] }],
    ['duration below floor', { ...validBody, durationMs: 1000 }],
  ])('rejects %s', async (_label, body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect(storeMock.zadd).not.toHaveBeenCalled();
  });

  it('returns 429 with Retry-After when rate limited', async () => {
    storeMock.incr.mockResolvedValue(11);
    const res = await POST(request(validBody));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    expect(storeMock.zadd).not.toHaveBeenCalled();
  });

  it('rate limits per IP using the durable counter', async () => {
    await POST(request(validBody));
    expect(storeMock.incr).toHaveBeenCalledWith('quiz:rl:score:1.2.3.4', 60);
  });
});
