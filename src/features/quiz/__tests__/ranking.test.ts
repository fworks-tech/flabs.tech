import { describe, expect, it } from "vitest";

import {
  RANK_COPY,
  rankFromAccuracy,
  rankFromScore,
  rankMeta,
} from "@/features/quiz/lib/ranking";

describe("rankFromAccuracy", () => {
  it("maps accuracy boundaries to the correct ranks", () => {
    expect(rankFromAccuracy(0)).toBe("Junior");
    expect(rankFromAccuracy(0.599)).toBe("Junior");
    expect(rankFromAccuracy(0.6)).toBe("Mid-Level");
    expect(rankFromAccuracy(0.749)).toBe("Mid-Level");
    expect(rankFromAccuracy(0.75)).toBe("Senior");
    expect(rankFromAccuracy(0.899)).toBe("Senior");
    expect(rankFromAccuracy(0.9)).toBe("Staff");
    expect(rankFromAccuracy(1)).toBe("Staff");
  });
});

describe("rankFromScore", () => {
  it("derives accuracy from correct/total", () => {
    expect(rankFromScore(12, 20)).toBe("Mid-Level");
    expect(rankFromScore(15, 20)).toBe("Senior");
    expect(rankFromScore(18, 20)).toBe("Staff");
  });

  it("never divides by zero", () => {
    expect(rankFromScore(0, 0)).toBe("Junior");
  });
});

describe("rankMeta", () => {
  it("returns badge and fun copy for each rank", () => {
    expect(rankMeta(18, 20).badge).toBe("Staff");
    expect(rankMeta(18, 20).copy).toBe(RANK_COPY.Staff);
    expect(rankMeta(4, 20).badge).toBe("Junior");
    expect(rankMeta(4, 20).copy).toBe(RANK_COPY.Junior);
  });
});
