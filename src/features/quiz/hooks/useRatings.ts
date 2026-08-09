"use client";

import { useEffect, useState } from "react";

export interface RatingsStat {
  up: number;
  down: number;
  total: number;
  recommendPct: number | null;
}

const EMPTY: RatingsStat = { up: 0, down: 0, total: 0, recommendPct: null };

/**
 * Recommendation aggregate for the start card. Returns null until loaded;
 * the caller hides the stat on failure — the game never blocks on it.
 */
export function useRatings(): RatingsStat | null {
  const [ratings, setRatings] = useState<RatingsStat | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/quiz/ratings");
        if (!res.ok) throw new Error(`ratings ${res.status}`);
        const data = (await res.json()) as {
          ratings: { up: number; down: number } | null;
        };
        if (!data.ratings) return;
        const total = data.ratings.up + data.ratings.down;
        setRatings({
          ...data.ratings,
          total,
          recommendPct: total > 0 ? Math.round((data.ratings.up / total) * 100) : null,
        });
      } catch {
        setRatings(EMPTY);
      }
    })();
  }, []);

  return ratings;
}
