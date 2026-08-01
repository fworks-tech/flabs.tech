import { Redis } from "@upstash/redis";

/**
 * Storage adapter for abuse-prevention state.
 *
 * Uses Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 * are configured, otherwise falls back to an in-memory Map (resets on cold start).
 *
 * @example
 * ```ts
 * await store.set(`abuse:case:${key}`, caseData, { ex: 3600 });
 * const data = await store.get<InvestigationCase>(`abuse:case:${key}`);
 * ```
 */

export interface StoreOptions {
  url?: string;
  token?: string;
}

export interface SetOptions {
  /** TTL in seconds */
  ex?: number;
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const memory = new Map<string, { value: string; expiresAt: number }>();

let redis: Redis | null = null;
if (url && token) {
  redis = new Redis({ url, token });
}

const memoryStore = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  },

  async set(key: string, value: unknown, opts?: SetOptions): Promise<void> {
    const ttlSeconds = opts?.ex ?? 0;
    memory.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0,
    });
  },

  async del(key: string): Promise<void> {
    memory.delete(key);
  },

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const current = (await memoryStore.get<number>(key)) ?? 0;
    const next = current + 1;
    await memoryStore.set(key, next, ttlSeconds ? { ex: ttlSeconds } : undefined);
    return next;
  },
};

export const store = {
  async get<T = unknown>(key: string): Promise<T | null> {
    if (redis) return redis.get<T>(key);
    return memoryStore.get<T>(key);
  },

  async set(key: string, value: unknown, opts?: SetOptions): Promise<void> {
    if (redis) {
      if (opts?.ex) {
        await redis.set(key, JSON.stringify(value), { ex: opts.ex });
      } else {
        await redis.set(key, JSON.stringify(value));
      }
      return;
    }
    return memoryStore.set(key, value, opts);
  },

  async del(key: string): Promise<void> {
    if (redis) {
      await redis.del(key);
      return;
    }
    return memoryStore.del(key);
  },

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (redis) {
      const value = await redis.incr(key);
      if (ttlSeconds) {
        await redis.expire(key, ttlSeconds);
      }
      return value;
    }
    return memoryStore.incr(key, ttlSeconds);
  },

  /** Whether the adapter is backed by persistent Redis (vs in-memory). */
  get persistent(): boolean {
    return redis !== null;
  },
};
