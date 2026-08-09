import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LeaderboardEntry } from "@/features/quiz/lib/leaderboard";
import { useLeaderboard } from "@/features/quiz/hooks/useLeaderboard";

const entries: LeaderboardEntry[] = [
  {
    id: "a",
    rank: 0,
    displayName: "Zara",
    score: 3400,
    accuracy: 0.85,
    maxStreak: 9,
    ts: 1786000000000,
  },
];

function mockFetchOnce(body: unknown, ok = true) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status: ok ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("useLeaderboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the current week board on mount", async () => {
    const fetchMock = mockFetchOnce({ entries });
    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.entries).toEqual(entries);
    expect(result.current.error).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith("/api/quiz/leaderboard?week=current");
  });

  it("re-fetches when the week changes", async () => {
    mockFetchOnce({ entries });
    const fetchMock = mockFetchOnce({ entries: [] });
    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    act(() => {
      result.current.switchWeek("all");
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/quiz/leaderboard?week=all");
    });
  });

  it("surfaces failures as error without throwing", async () => {
    mockFetchOnce(null, false);
    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe(true);
    expect(result.current.entries).toEqual([]);
  });

  it("saves a score and returns its rank", async () => {
    mockFetchOnce({ entries });
    const saveMock = mockFetchOnce({ ok: true, id: "uuid-9", rank: 2 });
    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let rank: number | null = null;
    await act(async () => {
      rank = await result.current.saveScore({
        displayName: "Zara",
        score: 3400,
        correct: 17,
        total: 20,
        maxStreak: 9,
        durationMs: 180_000,
      });
    });

    expect(rank).toBe(2);
    expect(result.current.saved).toEqual({ id: "uuid-9", rank: 2 });
    expect(saveMock).toHaveBeenCalledWith(
      "/api/quiz/score",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns null when saving fails", async () => {
    mockFetchOnce({ entries });
    mockFetchOnce(null, false);
    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let rank: number | null = 7;
    await act(async () => {
      rank = await result.current.saveScore({
        displayName: "Zara",
        score: 100,
        correct: 5,
        total: 20,
        maxStreak: 2,
        durationMs: 60_000,
      });
    });
    expect(rank).toBeNull();
  });
});
