"use client";

import { useCallback, useEffect, useState } from "react";

import type { LeaderboardEntry, ScorePayload } from "@/features/quiz/lib/leaderboard";

export type LeaderboardWeek = "current" | "all";

export interface SaveResult {
  id: string;
  rank: number | null;
}

/**
 * Fetches the top-10 leaderboard and saves scores. All calls are
 * best-effort: failures surface as `error` (rendered as a subtle
 * "unavailable" note) and never throw into gameplay.
 */
export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [week, setWeek] = useState<LeaderboardWeek>("current");
  const [saved, setSaved] = useState<SaveResult | null>(null);

  const fetchBoard = useCallback(async (w: LeaderboardWeek) => {
    try {
      const res = await fetch(`/api/quiz/leaderboard?week=${w}`);
      if (!res.ok) throw new Error(`leaderboard ${res.status}`);
      const data = (await res.json()) as { entries: LeaderboardEntry[] };
      setEntries(Array.isArray(data.entries) ? data.entries : []);
      setError(false);
    } catch {
      setEntries([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/quiz/leaderboard?week=${week}`);
        if (!res.ok) throw new Error(`leaderboard ${res.status}`);
        const data = (await res.json()) as { entries: LeaderboardEntry[] };
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setError(false);
      } catch {
        setEntries([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [week]);

  /** Week toggle: shows the loading state and lets the effect re-fetch. */
  const switchWeek = useCallback((w: LeaderboardWeek) => {
    setWeek(w);
    setLoading(true);
  }, []);

  const saveScore = useCallback(
    async (payload: ScorePayload): Promise<number | null> => {
      try {
        const res = await fetch("/api/quiz/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { ok: boolean; id: string; rank: number | null };
        setSaved({ id: data.id, rank: data.rank });
        await fetchBoard(week);
        return data.rank;
      } catch {
        return null;
      }
    },
    [fetchBoard, week],
  );

  return { entries, loading, error, week, switchWeek, saveScore, saved };
}
