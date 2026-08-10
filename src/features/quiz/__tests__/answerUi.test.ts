import { describe, expect, it } from 'vitest';

import { answerState, KEY_INDICES } from '@/features/quiz/lib/answerUi';
import type { QuizQuestion } from '@/features/quiz/data/questions';

const question: QuizQuestion = {
  id: 'q1',
  category: 'core',
  prompt: 'prompt',
  answers: ['a', 'b', 'c', 'd'],
  correctIndex: 2,
  explanation: 'why',
};

describe('KEY_INDICES', () => {
  it('maps number keys 1-4 and letter keys A-D to indexes', () => {
    expect(KEY_INDICES['1']).toBe(0);
    expect(KEY_INDICES['4']).toBe(3);
    expect(KEY_INDICES.a).toBe(0);
    expect(KEY_INDICES.D).toBe(3);
    expect(KEY_INDICES['5']).toBeUndefined();
    expect(KEY_INDICES.e).toBeUndefined();
  });
});

describe('answerState', () => {
  it('returns empty while unanswered', () => {
    expect(answerState(0, null, question)).toBe('');
    expect(answerState(2, null, question)).toBe('');
  });

  it('marks the correct index', () => {
    expect(answerState(2, 0, question)).toBe('correct');
    expect(answerState(2, 2, question)).toBe('correct');
  });

  it('marks the wrong pick', () => {
    expect(answerState(0, 0, question)).toBe('wrong');
  });

  it('dims the remaining answers', () => {
    expect(answerState(1, 0, question)).toBe('dimmed');
    expect(answerState(3, 0, question)).toBe('dimmed');
  });
});
