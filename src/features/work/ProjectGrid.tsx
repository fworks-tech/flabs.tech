import { logger } from "@/lib/logger";
import { fetchFeaturedRepos } from "@/lib/github-repos";
import Image from "next/image";
import Link from "next/link";
import styles from "./ProjectGrid.module.scss";

interface ProjectGridProps {
  /** Slice range: `[start, end]` (1-indexed). Omitting end shows all remaining. */
  range?: [number, number?];
  /** Slug values to exclude from the grid */
  exclude?: string[];
}

/**
 * Renders a responsive grid of project tiles fetched from GitHub.
 *
 * Supports optional range slicing and exclusion by slug. External links
 * are validated to only allow `http:` and `https:` protocols before
 * being used as link targets.
 */
export async function ProjectGrid({ range, exclude }: ProjectGridProps) {
  let allProjects = await fetchFeaturedRepos();

  if (exclude?.length) {
    allProjects = allProjects.filter((p) => !exclude.includes(p.detailSlug));
  }

  const sorted = allProjects.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const displayed = range ? sorted.slice(range[0] - 1, range[1] ?? sorted.length) : sorted;

  return (
    <div className={styles.grid}>
      {displayed.map((project) => {
        const tag = (project.tag || "").toLowerCase().replace(/[^a-z]/g, "-");
        const hasImages = project.images.length > 0;

        // Validate external links to prevent XSS - only allow http/https
        let href = `/projects/${project.detailSlug}`;
        if (project.link) {
          try {
            const url = new URL(project.link);
            if (url.protocol === "http:" || url.protocol === "https:") {
              href = url.href;
            }
          } catch (error) {
            logger.warn(error, "invalid project link URL, falling back to internal link");
          }
        }

        const safeSlug = project.slug.replace(/[^a-z0-9-_]/gi, "");
        const projectTags = project.tags || [];

        return (
          <Link key={safeSlug} href={href} className={styles.tile}>
            <div className={styles.tileImage} data-tag={tag}>
              {hasImages ? (
                <Image
                  src={project.images[0]}
                  alt={project.title}
                  fill
                  className={styles.img}
                />
              ) : (
                <>
                  <div className={styles.tileContent}>
                    {projectTags.length > 0 && (
                      <div className={styles.tagsList}>
                        {projectTags.slice(0, 3).map((t, idx) => (
                          <span key={idx} className={styles.tileTag}>
                            {t}
                          </span>
                        ))}
                        {projectTags.length > 3 && (
                          <span className={styles.tileTag}>+{projectTags.length - 3}</span>
                        )}
                      </div>
                    )}
                    <span className={styles.tileLabel}>{project.title}</span>
                  </div>
                </>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
