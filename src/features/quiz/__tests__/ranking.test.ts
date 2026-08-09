import { describe, expect, it } from "vitest";

import {
  RANK_COPY,
  rankFromAccuracy,
  rankFromScore,
  rankMeta,
} from "@/features/quiz/lib/ranking";

describe("rankFromAccuracy", () => {
  it("maps accuracy boundaries to the correct ranks", () => {
    expect(rankFromAccuracy(0)).toBe("Script Kiddie");
    expect(rankFromAccuracy(0.49)).toBe("Script Kiddie");
    expect(rankFromAccuracy(0.5)).toBe("Code Monkey");
    expect(rankFromAccuracy(0.64)).toBe("Code Monkey");
    expect(rankFromAccuracy(0.65)).toBe("Bug Slayer");
    expect(rankFromAccuracy(0.79)).toBe("Bug Slayer");
    expect(rankFromAccuracy(0.8)).toBe("Code Ninja");
    expect(rankFromAccuracy(0.89)).toBe("Code Ninja");
    expect(rankFromAccuracy(0.9)).toBe("JS Overlord");
    expect(rankFromAccuracy(1)).toBe("JS Overlord");
  });
});

describe("rankFromScore", () => {
  it("derives accuracy from correct/total", () => {
    expect(rankFromScore(10, 20)).toBe("Code Monkey");
    expect(rankFromScore(14, 20)).toBe("Bug Slayer");
    expect(rankFromScore(17, 20)).toBe("Code Ninja");
    expect(rankFromScore(19, 20)).toBe("JS Overlord");
  });

  it("never divides by zero", () => {
    expect(rankFromScore(0, 0)).toBe("Script Kiddie");
  });
});

describe("rankMeta", () => {
  it("returns badge and fun copy for each rank", () => {
    expect(rankMeta(19, 20).badge).toBe("JS Overlord");
    expect(rankMeta(19, 20).copy).toBe(RANK_COPY["JS Overlord"]);
    expect(rankMeta(8, 20).badge).toBe("Script Kiddie");
    expect(rankMeta(8, 20).copy).toBe(RANK_COPY["Script Kiddie"]);
  });
});
