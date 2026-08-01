import { beforeEach, describe, expect, it } from 'vitest';
import { decideResponse, maybeEscalate, responseMode } from '@/lib/abuse/respond';

describe('responseMode', () => {
  it('defaults to shadow', () => {
    process.env.ABUSE_RESPONSE_MODE = '';
    expect(responseMode()).toBe('shadow');
  });

  it('reads enforce mode', () => {
    process.env.ABUSE_RESPONSE_MODE = 'enforce';
    expect(responseMode()).toBe('enforce');
  });
});

describe('decideResponse', () => {
  it('blocks hard-blocked actors only in enforce mode', () => {
    const shadow = decideResponse('hard-block', 'shadow');
    expect(shadow.blocked).toBe(false);
    expect(shadow.status).toBe(403);

    const enforce = decideResponse('hard-block', 'enforce');
    expect(enforce.blocked).toBe(true);
    expect(enforce.status).toBe(403);
  });

  it('rejects soft-quarantine actors with retry-after in enforce mode', () => {
    const decision = decideResponse('soft-quarantine', 'enforce');
    expect(decision.blocked).toBe(true);
    expect(decision.status).toBe(429);
    expect(decision.retryAfter).toBe(600);
  });

  it('throttles without rejecting', () => {
    const decision = decideResponse('throttle', 'enforce');
    expect(decision.blocked).toBe(false);
    expect(decision.status).toBe(429);
    expect(decision.retryAfter).toBe(60);
  });

  it('allows untiered actors', () => {
    const decision = decideResponse('none', 'enforce');
    expect(decision.blocked).toBe(false);
    expect(decision.status).toBe(200);
  });
});

describe('maybeEscalate', () => {
  beforeEach(async () => {
    await maybeEscalate({ kind: 'reset', key: 'cleanup', detail: '', at: Date.now() });
  });

  it('fires on first event', async () => {
    const fired = await maybeEscalate({
      kind: 'block',
      key: '1.2.3.4',
      detail: 'x',
      at: Date.now(),
    });
    expect(fired).toBe(true);
  });

  it('coalesces repeats within the cooldown', async () => {
    const first = await maybeEscalate({
      kind: 'block',
      key: '5.5.5.5',
      detail: 'x',
      at: Date.now(),
    });
    const second = await maybeEscalate({
      kind: 'block',
      key: '5.5.5.5',
      detail: 'x',
      at: Date.now(),
    });
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('allows different keys independently', async () => {
    await maybeEscalate({ kind: 'block', key: '9.9.9.9', detail: 'x', at: Date.now() });
    const other = await maybeEscalate({
      kind: 'block',
      key: '8.8.8.8',
      detail: 'x',
      at: Date.now(),
    });
    expect(other).toBe(true);
  });
});
