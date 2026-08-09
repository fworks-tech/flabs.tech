"use client";

import { useEffect, useState } from "react";

/**
 * Per-question countdown. Starts at `durationMs` and ticks down via a
 * 100ms interval; calls `onTimeout` exactly once at zero and clears the
 * interval on unmount.
 *
 * The hook itself has no reset logic — mount it with `key={question.id}`
 * so React remounts (and re-arms) the timer for every question.
 */
export function useCountdown(durationMs: number, active: boolean, onTimeout: () => void): number {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      const left = durationMs - (Date.now() - startedAt);
      if (left <= 0) {
        window.clearInterval(intervalId);
        setRemaining(0);
        onTimeout();
        return;
      }
      setRemaining(left);
    }, 100);
    return () => window.clearInterval(intervalId);
  }, [active, durationMs, onTimeout]);

  return remaining;
}
