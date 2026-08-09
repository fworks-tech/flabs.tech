"use client";

import styles from "./TimerRing.module.scss";

interface TimerRingProps {
  remainingMs: number;
  durationMs: number;
}

const SIZE = 120;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * SVG circular countdown ring. Drains clockwise; pulses red under 3s.
 * Renders the remaining seconds for screen readers via aria-live.
 */
export function TimerRing({ remainingMs, durationMs }: TimerRingProps) {
  const fraction = durationMs > 0 ? Math.min(1, remainingMs / durationMs) : 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = remainingMs > 0 && remainingMs <= 3000;

  return (
    <div
      className={`${styles.wrap} ${urgent ? styles.urgent : ""}`}
      role="timer"
      aria-live="assertive"
      aria-label={`Time remaining: ${seconds} seconds`}
      data-testid="timer-ring"
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={styles.ring}
        aria-hidden="true"
      >
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} className={styles.track} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          className={styles.progress}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
        />
      </svg>
      <span className={styles.seconds}>{seconds}</span>
    </div>
  );
}
