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
