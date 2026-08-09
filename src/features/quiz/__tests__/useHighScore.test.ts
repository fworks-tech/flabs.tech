import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useHighScore, resetHighScoreStoreForTests } from "@/features/quiz/hooks/useHighScore";

describe("useHighScore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetHighScoreStoreForTests();
  });

  it("reads persisted values on mount", async () => {
    window.localStorage.setItem("devsprint.bestScore", "2500");
    window.localStorage.setItem("devsprint.bestStreak", "9");
    window.localStorage.setItem("devsprint.playerName", "Zara");

    const { result } = renderHook(() => useHighScore());
    await waitFor(() => {
      expect(result.current.bestScore).toBe(2500);
    });
    expect(result.current.bestStreak).toBe(9);
    expect(result.current.playerName).toBe("Zara");
  });

  it("defaults to zeros when nothing is stored", async () => {
    const { result } = renderHook(() => useHighScore());
    await waitFor(() => {
      expect(result.current.bestScore).toBe(0);
    });
    expect(result.current.bestStreak).toBe(0);
    expect(result.current.playerName).toBe("");
  });

  it("keeps the higher score and streak", async () => {
    const { result } = renderHook(() => useHighScore());
    await waitFor(() => {
      expect(result.current.bestScore).toBe(0);
    });

    act(() => result.current.submitScore(3000, 12));
    expect(result.current.bestScore).toBe(3000);
    expect(result.current.bestStreak).toBe(12);

    act(() => result.current.submitScore(1500, 20));
    expect(result.current.bestScore).toBe(3000);
    expect(result.current.bestStreak).toBe(20);

    expect(window.localStorage.getItem("devsprint.bestScore")).toBe("3000");
    expect(window.localStorage.getItem("devsprint.bestStreak")).toBe("20");
  });

  it("caps the player name at 20 characters", async () => {
    const { result } = renderHook(() => useHighScore());
    await waitFor(() => {
      expect(result.current.bestScore).toBe(0);
    });

    act(() => result.current.setPlayerName("A".repeat(50)));
    expect(result.current.playerName).toBe("A".repeat(20));
    expect(window.localStorage.getItem("devsprint.playerName")).toBe("A".repeat(20));
  });
});
