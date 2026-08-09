"use client";

import styles from "./Celebration.module.scss";

interface CelebrationProps {
  active: boolean;
  type?: "confetti" | "sparkle";
}

/**
 * Lightweight celebration effect using CSS animations.
 * Uses fixed positions based on index for deterministic rendering.
 */
export function Celebration({ active, type = "confetti" }: CelebrationProps) {
  if (!active) return null;

  const count = type === "confetti" ? 30 : 20;

  return (
    <div className={styles.container} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        // Deterministic positions based on index (golden ratio distribution)
        const phi = (1 + Math.sqrt(5)) / 2;
        const x = ((i * phi * 100) % 100);
        const y = -10 - ((i * 7) % 30);
        const rotation = (i * 137) % 360;
        const scale = 0.5 + (i % 5) * 0.1;
        const delay = (i % 10) * 0.05;

        return (
          <div
            key={i}
            className={`${styles.particle} ${type === "sparkle" ? styles.sparkle : styles.confetti}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `rotate(${rotation}deg) scale(${scale})`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
