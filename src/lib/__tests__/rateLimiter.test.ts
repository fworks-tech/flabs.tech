import { describe, expect, it } from 'vitest';

import { rateLimit } from '@/lib/rateLimiter';

let seq = 0;
/** Unique id per test so the durable store cannot leak state between cases. */
const id = () => `rl-test-${Date.now()}-${seq++}`;

describe('rateLimit', () => {
  it('allows the first request', async () => {
    await expect(rateLimit(id())).resolves.toMatchObject({ allowed: true });
  });

  it('allows up to the configured maximum', async () => {
    const key = id();
    for (let i = 0; i < 4; i++) {
      await expect(rateLimit(key)).resolves.toMatchObject({ allowed: true });
    }
    await expect(rateLimit(key)).resolves.toMatchObject({ allowed: true });
  });

  it('blocks after the maximum and reports the window', async () => {
    const key = id();
    for (let i = 0; i < 5; i++) {
      await rateLimit(key);
    }
    const result = await rateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(60);
  });

  it('tracks different identifiers independently', async () => {
    const blocked = id();
    for (let i = 0; i < 5; i++) {
      await rateLimit(blocked);
    }
    await expect(rateLimit(blocked)).resolves.toMatchObject({ allowed: false });
    await expect(rateLimit(id())).resolves.toMatchObject({ allowed: true });
  });
});
