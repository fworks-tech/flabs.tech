import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

async function loadRatings() {
  return await import("@/features/quiz/lib/ratings");
}

describe("validateRatingPayload", () => {
  it("accepts thumbs up or down without a comment", async () => {
    const { validateRatingPayload } = await loadRatings();
    expect(validateRatingPayload({ rating: 1 })).toEqual({ rating: 1, comment: "" });
    expect(validateRatingPayload({ rating: 0 })).toEqual({ rating: 0, comment: "" });
  });

  it("accepts an optional sanitized comment", async () => {
    const { validateRatingPayload } = await loadRatings();
    expect(validateRatingPayload({ rating: 1, comment: "  great\u0000 quiz  " })).toEqual({
      rating: 1,
      comment: "great quiz",
    });
  });

  it("rejects invalid ratings and junk bodies", async () => {
    const { validateRatingPayload } = await loadRatings();
    expect(validateRatingPayload({ rating: 2 })).toBeNull();
    expect(validateRatingPayload({ rating: "yes" })).toBeNull();
    expect(validateRatingPayload(null)).toBeNull();
    expect(validateRatingPayload([])).toBeNull();
  });
});

describe("addRating / getRatingsAggregate", () => {
  it("increments day counters for up and down", async () => {
    const { addRating, getRatingsAggregate } = await loadRatings();
    await addRating({ rating: 1, comment: "" });
    await addRating({ rating: 1, comment: "" });
    await addRating({ rating: 0, comment: "" });

    const aggregate = await getRatingsAggregate();
    expect(aggregate).toEqual({ up: 2, down: 1 });
  });

  it("aggregates across multiple days", async () => {
    const { addRating, getRatingsAggregate } = await loadRatings();
    const day = new Date().toISOString().slice(0, 10);
    const { store } = await import("@/lib/abuse/store");
    await store.set(`quiz:ratings:${day}:up`, 3);
    await store.set(`quiz:ratings:2026-01-01:up`, 2);
    await store.set(`quiz:ratings:2026-01-01:down`, 1);

    expect(await getRatingsAggregate()).toEqual({ up: 5, down: 1 });
  });

  it("keeps only the last 100 comments", async () => {
    const { addRating } = await loadRatings();
    const { store } = await import("@/lib/abuse/store");
    for (let i = 0; i < 120; i++) {
      await addRating({ rating: 1, comment: `c${i}` });
    }
    const comments = (await store.get<string[]>("quiz:ratings:comments")) ?? [];
    expect(comments).toHaveLength(100);
    expect(comments[99]).toBe("c119");
  });
});

describe("countReferralClick / getReferralClicks", () => {
  it("counts clicks across calls", async () => {
    const { countReferralClick, getReferralClicks } = await loadRatings();
    await countReferralClick();
    await countReferralClick();
    expect(await getReferralClicks()).toBe(2);
  });
});
