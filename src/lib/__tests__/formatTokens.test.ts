import { describe, expect, it } from 'vitest';

import { formatTokens } from '@/lib/formatTokens';

describe('formatTokens', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1.0k'],
    [12_345, '12.3k'],
    [999_999, '1000.0k'],
    [1_000_000, '1.0M'],
    [2_400_000, '2.4M'],
  ])('formats %i as %s', (n, expected) => {
    expect(formatTokens(n)).toBe(expected);
  });
});
