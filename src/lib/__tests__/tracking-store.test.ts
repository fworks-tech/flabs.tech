import { beforeEach, describe, expect, it, vi } from "vitest";

const storeMock = vi.hoisted(() => {
  const memory = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  const ttl = new Map<string, number>();

  return {
    get: vi.fn(async <T = unknown>(key: string): Promise<T | null> => {
      const expiry = ttl.get(key);
      if (expiry !== undefined && Date.now() > expiry) {
        memory.delete(key);
        ttl.delete(key);
        return null;
      }
      const raw = memory.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }),
    set: vi.fn(async (key: string, value: unknown, opts?: { ex?: number }) => {
      memory.set(key, JSON.stringify(value));
      if (opts?.ex) ttl.set(key, Date.now() + opts.ex * 1000);
    }),
    del: vi.fn(async (key: string) => {
      memory.delete(key);
      sets.delete(key);
      ttl.delete(key);
    }),
    incr: vi.fn(async (key: string) => {
      const next = (Number(memory.get(key) ?? "0") || 0) + 1;
      memory.set(key, String(next));
      return next;
    }),
    keys: vi.fn(async (pattern: string) => {
      const regex = new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".")}$`);
      return Array.from(memory.keys()).filter((k) => regex.test(k));
    }),
    pfadd: vi.fn(async (key: string, value: string) => {
      const set = sets.get(key) ?? new Set<string>();
      set.add(value);
      sets.set(key, set);
    }),
    pfcount: vi.fn(async (key: string) => sets.get(key)?.size ?? 0),
    __clear: () => {
      memory.clear();
      sets.clear();
      ttl.clear();
    },
  };
});

vi.mock("@/lib/abuse/store", () => ({ store: storeMock }));

beforeEach(() => {
  storeMock.__clear();
  storeMock.get.mockClear();
  storeMock.set.mockClear();
  storeMock.del.mockClear();
  storeMock.keys.mockClear();
  storeMock.pfadd.mockClear();
  storeMock.pfcount.mockClear();
});

describe("tracking-store", () => {
  it("aggregates daily counters, pages and uniques", async () => {
    const { recordEvent, getTotals, getTopPages, getDaySeries } = await import(
      "@/lib/tracking-store"
    );

    await recordEvent({ t: Date.now(), ty: "session_start", uid: "u1", sid: "s1", d: "mobile", b: "chrome" });
    await recordEvent({ t: Date.now(), ty: "page_view", uid: "u1", sid: "s1", p: "/blog", d: "mobile", b: "chrome" });
    await recordEvent({ t: Date.now(), ty: "page_view", uid: "u1", sid: "s1", p: "/blog", d: "mobile", b: "chrome" });
    await recordEvent({ t: Date.now(), ty: "nav_click", uid: "u1", sid: "s1", p: "/about" });

    const totals = await getTotals(1);
    expect(totals.pageviews).toBe(2);
    expect(totals.sessions).toBe(1);
    expect(totals.clicks).toBe(1);
    expect(totals.newVisitors).toBe(1);
    expect(totals.returningVisitors).toBe(0);
    expect(totals.devices.mobile).toBe(3);
    expect(totals.browsers.chrome).toBe(3);

    const topPages = await getTopPages(1);
    expect(topPages[0]).toEqual(["/blog", 2]);

    const series = await getDaySeries(1);
    expect(series).toHaveLength(1);
    expect(series[0].pageviews).toBe(2);
    expect(series[0].chatMessages).toBe(0);
  });

  it("detects returning visitors on a later session", async () => {
    const { recordEvent, getTotals } = await import("@/lib/tracking-store");

    await recordEvent({ t: Date.now(), ty: "session_start", uid: "u1", sid: "s1" });
    await recordEvent({ t: Date.now(), ty: "session_start", uid: "u1", sid: "s2" });

    const totals = await getTotals(1);
    expect(totals.newVisitors).toBe(1);
    expect(totals.returningVisitors).toBe(1);
    expect(totals.uniques).toBe(1);
  });

  it("keeps recent events bounded and newest-last", async () => {
    const { recordEvent, getRecentEvents, MAX_RECENT_EVENTS } = await import(
      "@/lib/tracking-store"
    );

    for (let i = 0; i < MAX_RECENT_EVENTS + 5; i++) {
      await recordEvent({ t: Date.now() + i, ty: "page_view", uid: "u1", sid: "s1", p: "/" });
    }

    const recent = await getRecentEvents(10);
    expect(recent).toHaveLength(10);
    const events = await storeMock.get<unknown[]>("analytics:events");
    expect((events as unknown[]).length).toBe(MAX_RECENT_EVENTS);
  });

  it("only counts page_view events into top pages", async () => {
    const { recordEvent, getTopPages } = await import("@/lib/tracking-store");

    await recordEvent({ t: Date.now(), ty: "page_view", uid: "u1", sid: "s1", p: "/blog" });
    await recordEvent({ t: Date.now(), ty: "scroll_depth", uid: "u1", sid: "s1", p: "/blog", v: 50 });

    const topPages = await getTopPages(1);
    expect(topPages).toEqual([["/blog", 1]]);
  });
});
