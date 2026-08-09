import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedbackItem } from "@/features/quiz/lib/feedback";

// Force the in-memory fallback (fresh module instance per test).
beforeEach(() => {
  vi.resetModules();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

async function loadFeedback() {
  return await import("@/features/quiz/lib/feedback");
}

describe("validateFeedbackPayload", () => {
  it("accepts a valid payload", async () => {
    const { validateFeedbackPayload } = await loadFeedback();
    expect(
      validateFeedbackPayload({ questionId: "event-loop-order", reason: "unclear", message: "X" }),
    ).toEqual({ questionId: "event-loop-order", reason: "unclear", message: "X" });
  });

  it("accepts a payload without a message", async () => {
    const { validateFeedbackPayload } = await loadFeedback();
    expect(validateFeedbackPayload({ questionId: "q1", reason: "typo" })).toEqual({
      questionId: "q1",
      reason: "typo",
      message: "",
    });
  });

  it("rejects missing or empty question ids", async () => {
    const { validateFeedbackPayload } = await loadFeedback();
    expect(validateFeedbackPayload({ reason: "typo" })).toBeNull();
    expect(validateFeedbackPayload({ questionId: "", reason: "typo" })).toBeNull();
    expect(validateFeedbackPayload(null)).toBeNull();
  });

  it("rejects unknown reasons (enum allowlist)", async () => {
    const { validateFeedbackPayload } = await loadFeedback();
    expect(
      validateFeedbackPayload({ questionId: "q1", reason: "broken-link" }),
    ).toBeNull();
  });

  it("strips control chars and caps the message at 200 chars", async () => {
    const { validateFeedbackPayload } = await loadFeedback();
    const result = validateFeedbackPayload({
      questionId: "q1",
      reason: "other",
      message: `bad\u0000 msg ${"x".repeat(300)}`,
    });
    expect(result?.message).toBe(`bad msg ${"x".repeat(192)}`);
  });
});

describe("addFeedback / listFeedback / read marks", () => {
  it("stores feedback and lists newest-first", async () => {
    const { addFeedback, listFeedback } = await loadFeedback();
    await addFeedback({ id: "1", questionId: "q1", reason: "typo", message: "a", at: 1, uid: "u" });
    await addFeedback({ id: "2", questionId: "q2", reason: "unclear", message: "b", at: 2, uid: "u" });
    const list = await listFeedback();
    expect(list.map((f: FeedbackItem) => f.id)).toEqual(["2", "1"]);
  });

  it("keeps only the last 500 entries", async () => {
    const { addFeedback, listFeedback } = await loadFeedback();
    for (let i = 0; i < 510; i++) {
      await addFeedback({
        id: String(i),
        questionId: "q1",
        reason: "other",
        message: "",
        at: i,
        uid: "u",
      });
    }
    const list = await listFeedback();
    expect(list).toHaveLength(500);
    expect(list[0].id).toBe("509");
  });

  it("marks entries as read", async () => {
    const { addFeedback, markFeedbackRead, isFeedbackRead, listFeedback } = await loadFeedback();
    await addFeedback({ id: "1", questionId: "q1", reason: "typo", message: "", at: 1, uid: "u" });
    expect(await isFeedbackRead("1")).toBe(false);
    await markFeedbackRead("1");
    expect(await isFeedbackRead("1")).toBe(true);
    expect((await listFeedback())[0].id).toBe("1");
  });
});
