import { describe, expect, it } from 'vitest';

import { calculateCost, checkCostLimit, estimateTokens, recordActualUsage } from '@/lib/abuse/cost';

let seq = 0;
/** Unique actor per test so the durable store cannot leak state between cases. */
const actor = () => `cost-test-${Date.now()}-${seq++}`;

describe('estimateTokens', () => {
  it('approximates tokens at ~4 chars each', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('hello')).toBe(2);
    expect(estimateTokens('a'.repeat(401))).toBe(101);
  });
});

describe('calculateCost', () => {
  it('scales tokens to USD', () => {
    expect(calculateCost(1_000_000)).toBeCloseTo(0.47);
    expect(calculateCost(500_000)).toBeCloseTo(0.235);
  });
});

describe('checkCostLimit', () => {
  it('allows requests under the hourly budget', async () => {
    const result = await checkCostLimit(actor(), 10_000);
    expect(result.allowed).toBe(true);
  });

  it('rejects requests that exceed the hourly budget', async () => {
    const key = actor();
    for (let i = 0; i < 3; i++) {
      await expect(checkCostLimit(key, 300_000)).resolves.toMatchObject({ allowed: true });
    }
    const result = await checkCostLimit(key, 300_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('does not bill denied requests', async () => {
    const key = actor();
    for (let i = 0; i < 3; i++) {
      await checkCostLimit(key, 300_000);
    }
    await expect(checkCostLimit(key, 300_000)).resolves.toMatchObject({ allowed: false });
    // 900k tokens counted, 100k still fits inside the ~1.06M token budget.
    await expect(checkCostLimit(key, 100_000)).resolves.toMatchObject({ allowed: true });
  });

  it('tracks actors independently', async () => {
    await checkCostLimit(actor(), 1_000_000);
    await expect(checkCostLimit(actor(), 1_000_000)).resolves.toMatchObject({ allowed: true });
  });
});

describe('recordActualUsage', () => {
  it('adjusts the request estimate down to the actual usage', async () => {
    const key = actor();
    const check = await checkCostLimit(key, 40_000);
    await recordActualUsage(check.usageKey, 10_000 - check.estimatedTokens);
    // Actual (10k) + next estimate (900k) must still fit — verifies the
    // estimate was replaced, not appended.
    await expect(checkCostLimit(key, 900_000)).resolves.toMatchObject({ allowed: true });
  });

  it('clamps an over-correction at zero instead of granting credit', async () => {
    const key = actor();
    const check = await checkCostLimit(key, 5000);
    await recordActualUsage(check.usageKey, -50_000);
    await expect(checkCostLimit(key, 1_000_000)).resolves.toMatchObject({ allowed: true });
    await expect(recordActualUsage(check.usageKey, 0)).resolves.toBeUndefined();
  });
});
