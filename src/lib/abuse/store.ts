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
const memoryHashes = new Map<string, Map<string, number>>();
const memoryHashExpiry = new Map<string, number>();
const memoryLists = new Map<string, unknown[]>();
const memoryListExpiry = new Map<string, number>();

let redis: Redis | null = null;
if (url && token) {
  redis = new Redis({ url, token });
}

export const storageBackend: 'redis' | 'memory' = redis ? 'redis' : 'memory';

/** Converts a Redis-style glob pattern (`*`, `?`) to a RegExp. */
function globToRegex(pattern: string): RegExp {
  let out = '';
  for (const ch of pattern) {
    if (ch === '*') out += '.*';
    else if (ch === '?') out += '.';
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    return memoryStore.incrby(key, 1, ttlSeconds);
  },

  async incrby(key: string, increment: number, ttlSeconds?: number): Promise<number> {
    const current = (await memoryStore.get<number>(key)) ?? 0;
    const next = current + increment;
    // Preserve an existing TTL when none is given, mirroring Redis INCR
    // (which never resets the expiry). Dropping it would let a ttl-less
    // counter live forever after one ttl-bearing write.
    let opts: SetOptions | undefined;
    if (ttlSeconds) {
      opts = { ex: ttlSeconds };
    } else {
      const existing = memory.get(key);
      if (existing && existing.expiresAt > 0) {
        const remainingMs = existing.expiresAt - Date.now();
        if (remainingMs > 0) opts = { ex: Math.ceil(remainingMs / 1000) };
      }
    }
    await memoryStore.set(key, next, opts);
    return next;
  },

  async getdel<T = unknown>(key: string): Promise<T | null> {
    const value = await memoryStore.get<T>(key);
    await memoryStore.del(key);
    return value;
  },
};

function liveHash(key: string): Map<string, number> | undefined {
  const expiresAt = memoryHashExpiry.get(key);
  if (expiresAt !== undefined && Date.now() > expiresAt) {
    memoryHashes.delete(key);
    memoryHashExpiry.delete(key);
    return undefined;
  }
  return memoryHashes.get(key);
}

const memoryHashOps = {
  async hincrby(
    key: string,
    field: string,
    increment: number,
    ttlSeconds?: number,
  ): Promise<number> {
    const hash = liveHash(key) ?? new Map<string, number>();
    const next = (hash.get(field) ?? 0) + increment;
    hash.set(field, next);
    memoryHashes.set(key, hash);
    if (ttlSeconds) {
      memoryHashExpiry.set(key, Date.now() + ttlSeconds * 1000);
    }
    return next;
  },

  async hgetall(key: string): Promise<Record<string, number>> {
    return Object.fromEntries(liveHash(key) ?? []);
  },

  async hlen(key: string): Promise<number> {
    return liveHash(key)?.size ?? 0;
  },
};

function liveList(key: string): unknown[] | undefined {
  const expiresAt = memoryListExpiry.get(key);
  if (expiresAt !== undefined && Date.now() > expiresAt) {
    memoryLists.delete(key);
    memoryListExpiry.delete(key);
    return undefined;
  }
  return memoryLists.get(key);
}

const memoryListOps = {
  async rpush(key: string, value: unknown, ttlSeconds?: number): Promise<number> {
    const list = liveList(key) ?? [];
    list.push(value);
    memoryLists.set(key, list);
    if (ttlSeconds) {
      memoryListExpiry.set(key, Date.now() + ttlSeconds * 1000);
    }
    return list.length;
  },

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    const list = liveList(key);
    if (!list) return;
    const from = start < 0 ? Math.max(0, list.length + start) : Math.min(start, list.length);
    const to = stop < 0 ? list.length + stop + 1 : Math.min(stop + 1, list.length);
    memoryLists.set(key, to <= from ? [] : list.slice(from, to));
  },

  async lrange<T>(key: string, start: number, stop: number): Promise<T[]> {
    const list = liveList(key);
    if (!list) return [];
    const from = start < 0 ? Math.max(0, list.length + start) : Math.min(start, list.length);
    const to = stop < 0 ? list.length + stop + 1 : Math.min(stop + 1, list.length);
    if (to <= from) return [];
    return list.slice(from, to) as T[];
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

  /** Atomically adds `increment` to a counter, applying the TTL when given. */
  async incrby(key: string, increment: number, ttlSeconds?: number): Promise<number> {
    if (redis) {
      const value = await redis.incrby(key, increment);
      if (ttlSeconds) {
        await redis.expire(key, ttlSeconds);
      }
      return value;
    }
    return memoryStore.incrby(key, increment, ttlSeconds);
  },

  /** Reads and deletes a key in one step (one-shot tokens, run seeds). */
  async getdel<T = unknown>(key: string): Promise<T | null> {
    if (redis) {
      return redis.getdel<T>(key);
    }
    return memoryStore.getdel<T>(key);
  },

  /** Adds `increment` to a hash field, applying the TTL when given. */
  async hincrby(
    key: string,
    field: string,
    increment: number,
    ttlSeconds?: number,
  ): Promise<number> {
    if (redis) {
      const value = await redis.hincrby(key, field, increment);
      if (ttlSeconds) {
        await redis.expire(key, ttlSeconds);
      }
      return value;
    }
    return memoryHashOps.hincrby(key, field, increment, ttlSeconds);
  },

  /**
   * Returns every field/value pair of a hash (empty object when absent).
   * Hash fields are assumed to be numeric counters; non-numeric values
   * (only possible on the Redis path) coerce to `NaN`.
   */
  async hgetall(key: string): Promise<Record<string, number>> {
    if (redis) {
      const raw = (await redis.hgetall<Record<string, string | number>>(key)) ?? {};
      // Upstash returns hash fields as strings; coerce to numbers so callers
      // (analytics) can do arithmetic without string concatenation.
      return Object.fromEntries(
        Object.entries(raw).map(([field, value]) => [field, Number(value)]),
      );
    }
    return memoryHashOps.hgetall(key);
  },

  /** Number of fields in a hash. */
  async hlen(key: string): Promise<number> {
    if (redis) {
      return redis.hlen(key);
    }
    return memoryHashOps.hlen(key);
  },

  /** Appends a value to a list, applying the TTL when given. */
  async rpush(key: string, value: unknown, ttlSeconds?: number): Promise<number> {
    if (redis) {
      const length = await redis.rpush(key, value);
      if (ttlSeconds) {
        await redis.expire(key, ttlSeconds);
      }
      return length;
    }
    return memoryListOps.rpush(key, value, ttlSeconds);
  },

  /** Trims a list to the given rank range (negative indexes count from the end). */
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    if (redis) {
      await redis.ltrim(key, start, stop);
      return;
    }
    return memoryListOps.ltrim(key, start, stop);
  },

  /** Returns a list slice (negative indexes count from the end). */
  async lrange<T = unknown>(key: string, start: number, stop: number): Promise<T[]> {
    if (redis) {
      return (await redis.lrange<T>(key, start, stop)) ?? [];
    }
    return memoryListOps.lrange<T>(key, start, stop);
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
