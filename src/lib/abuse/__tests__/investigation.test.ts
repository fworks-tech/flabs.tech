import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import {
  clearCase,
  getCase,
  recordSignal,
  resolveKey,
  retentionMs,
} from '@/lib/abuse/investigation';

describe('investigation', () => {
  beforeEach(async () => {
    process.env.ABUSE_TRACK_IP = 'true';
    process.env.ABUSE_RETENTION_MS = '';
    await clearCase('test-key');
  });

  it('creates a case on first signal', async () => {
    const result = await recordSignal(
      'test-key',
      { kind: 'rate', detail: 'hit', at: Date.now() },
      {
        rateViolated: true,
      },
    );
    expect(result.key).toBe('test-key');
    expect(result.decision).toBe('contained');
    expect(result.signals).toHaveLength(1);
  });

  it('keeps severity low for benign activity', async () => {
    const result = await recordSignal(
      'test-key',
      { kind: 'info', detail: 'ok', at: Date.now() },
      {},
    );
    expect(result.severity).toBe('low');
    expect(result.decision).toBe('open');
  });

  it('accumulates evidence across signals', async () => {
    const first = await recordSignal(
      'test-key',
      { kind: 'rate', detail: 'hit 1', at: Date.now() },
      { rateViolated: true },
    );
    const second = await recordSignal(
      'test-key',
      { kind: 'malformed', detail: 'bad payload', at: Date.now() },
      { malformed: true },
    );
    expect(second.signals).toHaveLength(2);
    expect(second.score).toBeGreaterThan(first.score);
    expect(second.severity).not.toBe('low');
  });

  it('caps stored signals at 50', async () => {
    for (let i = 0; i < 55; i++) {
      await recordSignal(
        'test-key',
        { kind: 'rate', detail: `hit ${i}`, at: Date.now() },
        { rateViolated: true },
      );
    }
    const current = await getCase('test-key');
    expect(current?.signals).toHaveLength(50);
  });

  it('recovers to low severity once signals decay', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const first = await recordSignal(
        'test-key',
        { kind: 'rate', detail: 'hit', at: Date.now() },
        { rateViolated: true },
      );
      expect(first.severity).not.toBe('low');

      // 2h later: features decay with a 30min half-life (1 → 1/16), so the
      // case reopens even without any new evidence.
      vi.setSystemTime(new Date('2026-01-01T02:00:00Z'));
      const later = await recordSignal(
        'test-key',
        { kind: 'info', detail: 'benign', at: Date.now() },
        {},
      );
      expect(later.severity).toBe('low');
      expect(later.decision).toBe('open');
      expect(later.score).toBeLessThan(first.score);
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-accumulates after decay on repeat offenses', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      await recordSignal(
        'test-key',
        { kind: 'rate', detail: 'hit', at: Date.now() },
        { rateViolated: true },
      );
      vi.setSystemTime(new Date('2026-01-01T02:00:00Z'));
      const again = await recordSignal(
        'test-key',
        { kind: 'rate', detail: 'hit again', at: Date.now() },
        { rateViolated: true },
      );
      expect(again.severity).not.toBe('low');
      expect(again.features.rateViolation).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears a case', async () => {
    await recordSignal(
      'test-key',
      { kind: 'rate', detail: 'hit', at: Date.now() },
      { rateViolated: true },
    );
    await clearCase('test-key');
    expect(await getCase('test-key')).toBeNull();
  });
});

describe('resolveKey', () => {
  it('returns the identifier when IP tracking is enabled', () => {
    process.env.ABUSE_TRACK_IP = 'true';
    expect(resolveKey('1.2.3.4')).toBe('1.2.3.4');
  });

  it('anonymizes the identifier when IP tracking is disabled', () => {
    process.env.ABUSE_TRACK_IP = 'false';
    const key = resolveKey('1.2.3.4');
    expect(key).toMatch(/^anon:/);
    expect(key).not.toContain('1.2.3.4');
  });

  it('produces deterministic pseudonymous keys per secret', () => {
    process.env.ABUSE_TRACK_IP = 'false';
    process.env.ABUSE_KEY_SECRET = 'test-secret';
    const a = resolveKey('1.2.3.4');
    const b = resolveKey('1.2.3.4');
    const c = resolveKey('5.6.7.8');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  afterEach(() => {
    delete process.env.ABUSE_KEY_SECRET;
  });
});

describe('retentionMs', () => {
  it('defaults to 1 hour', () => {
    process.env.ABUSE_RETENTION_MS = '';
    expect(retentionMs()).toBe(3600_000);
  });

  it('reads the env override', () => {
    process.env.ABUSE_RETENTION_MS = '60000';
    expect(retentionMs()).toBe(60_000);
  });
});
