import { describe, expect, it } from 'vitest';

import {
  CORRECT_FEEDBACK_MS,
  feedbackDelayMs,
  WRONG_FEEDBACK_MS,
} from '@/features/quiz/lib/pacing';

describe('feedbackDelayMs', () => {
  it('keeps correct answers snappy', () => {
    expect(feedbackDelayMs(true)).toBe(CORRECT_FEEDBACK_MS);
  });

  it('holds wrong answers for the learning pause', () => {
    expect(feedbackDelayMs(false)).toBe(WRONG_FEEDBACK_MS);
  });

  it('gives wrong answers the longer window', () => {
    expect(WRONG_FEEDBACK_MS).toBeGreaterThan(CORRECT_FEEDBACK_MS);
  });
});
