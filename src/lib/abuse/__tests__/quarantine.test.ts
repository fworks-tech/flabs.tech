import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyQuarantine,
  effectiveTier,
  escalateQuarantine,
  getQuarantine,
  releaseQuarantine,
  tierForScore,
} from '@/lib/abuse/quarantine';

const shortTtl = {
  ttlMs: {
    throttle: 60_000,
    'soft-quarantine': 60_000,
    'hard-block': 60_000,
  },
};

describe('tierForScore', () => {
  it('maps verdicts to tiers', () => {
    expect(tierForScore('critical', 'malicious')).toBe('hard-block');
    expect(tierForScore('high', 'suspicious')).toBe('soft-quarantine');
    expect(tierForScore('medium', 'neutral')).toBe('throttle');
    expect(tierForScore('low', 'trusted')).toBe('none');
  });
});

describe('quarantine', () => {
  beforeEach(async () => {
    await releaseQuarantine('q-key');
    await releaseQuarantine('q-key-2');
  });

  it('applies a quarantine with TTL', async () => {
    const entry = await applyQuarantine(
      'q-key',
      'soft-quarantine',
      'suspicious behavior',
      'high',
      'suspicious',
      shortTtl,
    );
    expect(entry.tier).toBe('soft-quarantine');
    expect(entry.expiresAt).toBeGreaterThan(Date.now());
    expect(await effectiveTier('q-key')).toBe('soft-quarantine');
  });

  it('returns none for unquarantined keys', async () => {
    expect(await effectiveTier('q-key')).toBe('none');
  });

  it('auto-releases after TTL expiry', async () => {
    await applyQuarantine('q-key', 'throttle', 'temp', 'medium', 'neutral', {
      ttlMs: { throttle: 1, 'soft-quarantine': 1, 'hard-block': 1 },
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(await effectiveTier('q-key')).toBe('none');
  });

  it('escalates to stricter tiers but never downgrades', async () => {
    await applyQuarantine('q-key', 'throttle', 'first', 'medium', 'neutral', shortTtl);
    const escalated = await escalateQuarantine(
      'q-key',
      'hard-block',
      'worse',
      'critical',
      'malicious',
      shortTtl,
    );
    expect(escalated?.tier).toBe('hard-block');

    const downgrade = await escalateQuarantine(
      'q-key',
      'throttle',
      'back',
      'medium',
      'neutral',
      shortTtl,
    );
    expect(downgrade?.tier).toBe('hard-block');
  });

  it('does not escalate keys with no active quarantine', async () => {
    const result = await escalateQuarantine(
      'q-key-2',
      'hard-block',
      'nope',
      'critical',
      'malicious',
      shortTtl,
    );
    expect(result).toBeNull();
  });

  it('releases a quarantine', async () => {
    await applyQuarantine('q-key', 'hard-block', 'blocked', 'critical', 'malicious', shortTtl);
    await releaseQuarantine('q-key');
    expect(await getQuarantine('q-key')).toBeNull();
  });

  it('tracks keys independently', async () => {
    await applyQuarantine('q-key', 'hard-block', 'blocked', 'critical', 'malicious', shortTtl);
    expect(await effectiveTier('q-key-2')).toBe('none');
  });
});
