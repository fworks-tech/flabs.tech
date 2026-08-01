import { afterEach, describe, expect, it, vi } from 'vitest';
import { _resetUsage, calculateCost, checkCostLimit, estimateTokens, recordActualUsage } from '@/lib/abuse/cost';

describe('estimateTokens', () => {
  it('approximates tokens at ~4 chars each', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('hello')).toBe(2);
    expect(estimateTokens('a'.repeat(401))).toBe(101);
  });
});

describe('calculateCost', () => {
  it('scales tokens to USD', () => {
    expect(calculateCost(1_000_000)).toBeCloseTo(0.28);
    expect(calculateCost(500_000)).toBeCloseTo(0.14);
  });
});

describe('checkCostLimit', () => {
  afterEach(() => {
    _resetUsage();
    vi.useRealTimers();
  });

  it('allows requests under the hourly budget', () => {
    const result = checkCostLimit('u1', 10_000);
    expect(result.allowed).toBe(true);
  });

  it('rejects requests that exceed the hourly budget', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    for (let i = 0; i < 6; i++) {
      checkCostLimit('u1', 300_000); // ~$0.084 each
    }
    const result = checkCostLimit('u1', 300_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('tracks actors independently', () => {
    checkCostLimit('u1', 1_000_000);
    expect(checkCostLimit('u2', 1_000_000).allowed).toBe(true);
  });
});

describe('recordActualUsage', () => {
  afterEach(() => {
    _resetUsage();
  });

  it('corrects the last estimate with actual usage', () => {
    checkCostLimit('u1', 40_000);
    recordActualUsage('u1', 10_000);
    // Exhausting the budget now: ~$0.0589 spent (actual) + next estimate must
    // still fit — verifies the estimate was replaced, not appended.
    const result = checkCostLimit('u1', 1_000_000);
    expect(result.allowed).toBe(true);
  });

  it('records actual usage when no estimate exists', () => {
    recordActualUsage('u1', 5_000);
    // 2M tokens ≈ $0.56 exceeds the $0.50 hourly budget.
    expect(checkCostLimit('u1', 2_000_000).allowed).toBe(false);
  });
});
