import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Force the in-memory fallback regardless of environment.
beforeEach(() => {
  vi.resetModules();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function loadStore() {
  return (await import("@/lib/abuse/store")).store;
}

describe("store memory fallback", () => {
  it("get/set round-trips JSON values", async () => {
    const store = await loadStore();
    await store.set("test:obj", { a: 1, nested: { b: "x" } });
    await expect(store.get<{ a: number }>("test:obj")).resolves.toEqual({ a: 1, nested: { b: "x" } });
  });

  it("expires entries after their TTL", async () => {
    vi.useFakeTimers();
    const store = await loadStore();
    await store.set("test:ttl", "value", { ex: 1 });
    vi.advanceTimersByTime(1500);
    await expect(store.get("test:ttl")).resolves.toBeNull();
    vi.useRealTimers();
  });

  it("del removes entries", async () => {
    const store = await loadStore();
    await store.set("test:del", "value");
    await store.del("test:del");
    await expect(store.get("test:del")).resolves.toBeNull();
  });

  it("incr increments and respects TTL", async () => {
    const store = await loadStore();
    await expect(store.incr("test:count")).resolves.toBe(1);
    await expect(store.incr("test:count")).resolves.toBe(2);
  });

  it("keys matches glob patterns", async () => {
    const store = await loadStore();
    await store.set("abuse:case:alpha", 1);
    await store.set("abuse:case:beta", 2);
    await store.set("analytics:counters:2026-08-04", 3);

    const cases = await store.keys("abuse:case:*");
    expect(cases.sort()).toEqual(["abuse:case:alpha", "abuse:case:beta"]);
    expect(await store.keys("abuse:quarantine:*")).toEqual([]);
    expect(await store.keys("a?use:*")).toHaveLength(2);
  });

  it("pfadd/pfcount approximate unique cardinality", async () => {
    const store = await loadStore();
    await store.pfadd("test:uv", "visitor-1");
    await store.pfadd("test:uv", "visitor-2");
    await store.pfadd("test:uv", "visitor-1");
    await expect(store.pfcount("test:uv")).resolves.toBe(2);
    await expect(store.pfcount("test:missing")).resolves.toBe(0);
  });
});

describe("store memory ZSETs", () => {
  it("zadd + zrevrange returns members by descending score", async () => {
    const store = await loadStore();
    await store.zadd("quiz:lb", 100, "alpha");
    await store.zadd("quiz:lb", 300, "charlie");
    await store.zadd("quiz:lb", 200, "bravo");
    await expect(store.zrevrange("quiz:lb", 0, -1)).resolves.toEqual([
      "charlie",
      "bravo",
      "alpha",
    ]);
    await expect(store.zrevrange("quiz:lb", 0, 1)).resolves.toEqual(["charlie", "bravo"]);
    await expect(store.zrevrange("quiz:lb", -2, -1)).resolves.toEqual(["bravo", "alpha"]);
  });

  it("zrange returns members by ascending score", async () => {
    const store = await loadStore();
    await store.zadd("quiz:lb", 100, "alpha");
    await store.zadd("quiz:lb", 300, "charlie");
    await store.zadd("quiz:lb", 200, "bravo");
    await expect(store.zrange("quiz:lb", 0, -1)).resolves.toEqual([
      "alpha",
      "bravo",
      "charlie",
    ]);
  });

  it("zadd replaces the score of an existing member", async () => {
    const store = await loadStore();
    await store.zadd("quiz:lb", 100, "alpha");
    await store.zadd("quiz:lb", 900, "alpha");
    await expect(store.zrevrange("quiz:lb", 0, -1)).resolves.toEqual(["alpha"]);
  });

  it("zrevrank returns the descending rank or null", async () => {
    const store = await loadStore();
    await store.zadd("quiz:lb", 100, "alpha");
    await store.zadd("quiz:lb", 300, "charlie");
    await store.zadd("quiz:lb", 200, "bravo");
    await expect(store.zrevrank("quiz:lb", "charlie")).resolves.toBe(0);
    await expect(store.zrevrank("quiz:lb", "alpha")).resolves.toBe(2);
    await expect(store.zrevrank("quiz:lb", "missing")).resolves.toBeNull();
  });

  it("zremrangebyrank trims the ascending tail", async () => {
    const store = await loadStore();
    for (const [member, score] of [
      ["a", 1],
      ["b", 2],
      ["c", 3],
      ["d", 4],
    ] as const) {
      await store.zadd("quiz:lb", score, member);
    }
    await expect(store.zremrangebyrank("quiz:lb", 2, -1)).resolves.toBe(2);
    await expect(store.zrevrange("quiz:lb", 0, -1)).resolves.toEqual(["b", "a"]);
  });

  it("operations on missing keys return empty results", async () => {
    const store = await loadStore();
    await expect(store.zrevrange("quiz:none", 0, -1)).resolves.toEqual([]);
    await expect(store.zrevrank("quiz:none", "x")).resolves.toBeNull();
    await expect(store.zremrangebyrank("quiz:none", 0, -1)).resolves.toBe(0);
  });
});
