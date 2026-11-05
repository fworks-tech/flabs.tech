import { describe, expect, it } from 'vitest';

import { scoreAnswers } from '@/features/quiz/lib/scoring';

const deck = [{ correctIndex: 0 }, { correctIndex: 1 }, { correctIndex: 2 }];

describe('scoreAnswers', () => {
  it('replays picks with the streak multiplier', () => {
    expect(scoreAnswers(deck, [0, 1, 2])).toEqual({
      score: 100 + 200 + 300,
      correct: 3,
      total: 3,
      maxStreak: 3,
    });
  });

  it('resets the streak on a wrong pick', () => {
    expect(scoreAnswers(deck, [0, 0, 2])).toEqual({
      score: 100 + 0 + 100,
      correct: 2,
      total: 3,
      maxStreak: 1,
    });
  });

  it('treats a timeout (-1) as a wrong answer', () => {
    expect(scoreAnswers(deck, [-1, 1])).toEqual({
      score: 0 + 100,
      correct: 1,
      total: 3,
      maxStreak: 1,
    });
  });

  it('caps the multiplier at x5', () => {
    const longDeck = Array.from({ length: 8 }, () => ({ correctIndex: 0 }));
    const result = scoreAnswers(
      longDeck,
      longDeck.map(() => 0),
    );
    // 100 + 200 + 300 + 400 + 500 + 500 + 500 + 500
    expect(result.score).toBe(3000);
    expect(result.maxStreak).toBe(8);
  });

  it('ignores picks past the end of the deck', () => {
    expect(scoreAnswers(deck, [0, 1, 2, 0, 0])).toMatchObject({ correct: 3, total: 3 });
  });
});
