import styles from "./ProjectGrid.module.scss";

/**
 * Streaming placeholder for the GitHub-backed project grid.
 *
 * Reuses the real tile geometry (1/1 aspect, gradient, breathe animation)
 * so the swap-in causes no layout shift.
 */
export function ProjectGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.grid} aria-hidden="true" data-testid="project-grid-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.tile}>
          <div className={styles.tileImage} />
        </div>
      ))}
    </div>
  );
}
