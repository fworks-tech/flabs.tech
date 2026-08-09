import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  evaluateAchievements,
  resetAchievementsStoreForTests,
  useAchievements,
  type AchievementStats,
} from "@/features/quiz/hooks/useAchievements";

const baseStats: AchievementStats = {
  correctCount: 10,
  total: 20,
  livesLeft: 2,
  averageTimeMs: 6000,
  completed: true,
};

describe("evaluateAchievements", () => {
  it("always awards first blood for a completed game", () => {
    expect(evaluateAchievements(baseStats)).toContain("first_blood");
  });

  it("awards perfect only for 20/20", () => {
    expect(evaluateAchievements({ ...baseStats, correctCount: 19 }).includes("perfect")).toBe(false);
    expect(evaluateAchievements({ ...baseStats, correctCount: 20 })).toContain("perfect");
  });

  it("awards speed demon for 10+ correct under 5s average", () => {
    expect(
      evaluateAchievements({ ...baseStats, averageTimeMs: 5001 }).includes("speed_demon"),
    ).toBe(false);
    expect(
      evaluateAchievements({ ...baseStats, averageTimeMs: 5000 }).includes("speed_demon"),
    ).toBe(true);
    expect(
      evaluateAchievements({ ...baseStats, correctCount: 9, averageTimeMs: 2000 }).includes(
        "speed_demon",
      ),
    ).toBe(false);
  });

  it("awards comeback only when the deck is completed with 1 life left", () => {
    expect(evaluateAchievements({ ...baseStats, livesLeft: 1 })).toContain("comeback");
    expect(
      evaluateAchievements({ ...baseStats, livesLeft: 2 }).includes("comeback"),
    ).toBe(false);
    expect(
      evaluateAchievements({ ...baseStats, livesLeft: 1, completed: false }).includes(
        "comeback",
      ),
    ).toBe(false);
  });

  it("awards sharpshooter at exactly 80% accuracy", () => {
    expect(
      evaluateAchievements({ ...baseStats, correctCount: 16, total: 20 }).includes(
        "sharpshooter",
      ),
    ).toBe(true);
    expect(
      evaluateAchievements({ ...baseStats, correctCount: 15, total: 19 }).includes(
        "sharpshooter",
      ),
    ).toBe(false);
  });
});

describe("useAchievements", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetAchievementsStoreForTests();
  });

  it("returns only newly unlocked ids on first unlock", async () => {
    const { result } = renderHook(() => useAchievements());
    await waitFor(() => {
      expect(result.current.unlocked).toEqual([]);
    });

    let fresh: string[] = [];
    act(() => {
      fresh = result.current.unlock(["first_blood", "sharpshooter"]);
    });
    expect(fresh.sort()).toEqual(["first_blood", "sharpshooter"]);
    expect(result.current.unlocked.sort()).toEqual(["first_blood", "sharpshooter"]);
  });

  it("does not re-unlock achievements on replays", async () => {
    const { result } = renderHook(() => useAchievements());
    await waitFor(() => {
      expect(result.current.unlocked).toEqual([]);
    });

    act(() => {
      result.current.unlock(["first_blood"]);
    });
    let fresh: string[] = ["stale"];
    act(() => {
      fresh = result.current.unlock(["first_blood", "perfect"]);
    });
    expect(fresh).toEqual(["perfect"]);
    expect(result.current.unlocked).toEqual(["first_blood", "perfect"]);
  });

  it("persists across mounts", async () => {
    const first = renderHook(() => useAchievements());
    await waitFor(() => {
      expect(first.result.current.unlocked).toEqual([]);
    });
    act(() => {
      first.result.current.unlock(["comeback"]);
    });

    const second = renderHook(() => useAchievements());
    await waitFor(() => {
      expect(second.result.current.unlocked).toEqual(["comeback"]);
    });
  });
});
