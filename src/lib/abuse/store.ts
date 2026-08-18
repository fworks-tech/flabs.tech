import { Redis } from '@upstash/redis';

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

export interface SetOptions {
  /** TTL in seconds */
  ex?: number;
}

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const memory = new Map<string, { value: string; expiresAt: number }>();
const memorySets = new Map<string, Set<string>>();
const memoryZsets = new Map<string, Map<string, number>>();

let redis: Redis | null = null;
if (url && token) {
  redis = new Redis({ url, token });
}

export const storageBackend: 'redis' | 'memory' = redis ? 'redis' : 'memory';

/** Converts a Redis-style glob pattern (`*`, `?`) to a RegExp. */
function globToRegex(pattern: string): RegExp {
  let out = "";
  for (const ch of pattern) {
    if (ch === "*") out += ".*";
    else if (ch === "?") out += ".";
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

function getZset(key: string): Map<string, number> {
  let set = memoryZsets.get(key);
  if (!set) {
    set = new Map<string, number>();
    memoryZsets.set(key, set);
  }
  return set;
}

function sortedMembers(set: Map<string, number>, desc = false): string[] {
  return Array.from(set.entries())
    .sort((a, b) =>
      desc ? b[1] - a[1] || a[0].localeCompare(b[0]) : a[1] - b[1] || a[0].localeCompare(b[0]),
    )
    .map(([member]) => member);
}

/** Applies Redis rank-range semantics (`0 -1` = whole list, negative from end). */
function redisRange<T>(arr: T[], start: number, stop: number): T[] {
  const s = start < 0 ? Math.max(0, arr.length + start) : Math.min(start, arr.length);
  const e = stop < 0 ? arr.length + stop + 1 : Math.min(stop + 1, arr.length);
  if (e <= s) return [];
  return arr.slice(s, e);
}

const memoryZsetOps = {
  async zadd(key: string, score: number, member: string): Promise<void> {
    getZset(key).set(member, score);
  },

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return redisRange(sortedMembers(getZset(key)), start, stop);
  },

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    return redisRange(sortedMembers(getZset(key), true), start, stop);
  },

  async zrevrank(key: string, member: string): Promise<number | null> {
    const index = sortedMembers(getZset(key), true).indexOf(member);
    return index === -1 ? null : index;
  },

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    const set = getZset(key);
    const toRemove = redisRange(sortedMembers(set), start, stop);
    for (const member of toRemove) set.delete(member);
    return toRemove.length;
  },
};

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

  /**
   * Lists keys matching a Redis-style glob pattern (`*`, `?`).
   *
   * Note: `KEYS` is discouraged in production Redis, but this store is used
   * by the admin dashboards on a low-traffic personal site where the
   * key space is tiny and bounded by TTLs. In-memory fallback scans the Map.
   */
  async keys(pattern: string): Promise<string[]> {
    if (redis) {
      const result = await redis.keys(pattern);
      return result ?? [];
    }
    const regex = globToRegex(pattern);
    return Array.from(memory.keys()).filter((key) => regex.test(key));
  },

  /** Adds a member to a HyperLogLog set (unique-count approximation). */
  async pfadd(key: string, value: string): Promise<void> {
    if (redis) {
      await redis.pfadd(key, value);
      return;
    }
    const set = memorySets.get(key) ?? new Set<string>();
    set.add(value);
    memorySets.set(key, set);
  },

  /** Returns the approximate cardinality of a HyperLogLog set. */
  async pfcount(key: string): Promise<number> {
    if (redis) {
      return redis.pfcount(key);
    }
    return memorySets.get(key)?.size ?? 0;
  },

  /** Adds `member` with `score` to a sorted set (replaces on conflict). */
  async zadd(key: string, score: number, member: string, ttlSeconds?: number): Promise<void> {
    if (redis) {
      await redis.zadd(key, { score, member });
      if (ttlSeconds) {
        await redis.expire(key, ttlSeconds);
      }
      return;
    }
    return memoryZsetOps.zadd(key, score, member);
  },

  /** Returns members ordered by ascending score (rank range semantics). */
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    if (redis) {
      return (await redis.zrange(key, start, stop)) ?? [];
    }
    return memoryZsetOps.zrange(key, start, stop);
  },

  /** Returns members ordered by descending score (rank range semantics). */
  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    if (redis) {
      return (await redis.zrange(key, start, stop, { rev: true })) ?? [];
    }
    return memoryZsetOps.zrevrange(key, start, stop);
  },

  /** Returns the 0-based descending rank of `member`, or null when absent. */
  async zrevrank(key: string, member: string): Promise<number | null> {
    if (redis) {
      return redis.zrevrank(key, member);
    }
    return memoryZsetOps.zrevrank(key, member);
  },

  /** Removes members within an ascending rank range; returns the count removed. */
  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    if (redis) {
      return redis.zremrangebyrank(key, start, stop);
    }
    return memoryZsetOps.zremrangebyrank(key, start, stop);
  },
};
