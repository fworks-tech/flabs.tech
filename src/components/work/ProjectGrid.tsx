import Link from "next/link";
import { getPosts } from "@/utils/utils";
import styles from "./ProjectGrid.module.scss";

interface ProjectGridProps {
  range?: [number, number?];
  exclude?: string[];
}

export function ProjectGrid({ range, exclude }: ProjectGridProps) {
  let allProjects = getPosts(["src", "app", "work", "projects"]);

  if (exclude?.length) {
    allProjects = allProjects.filter((p) => !exclude!.includes(p.slug));
  }

  const sorted = allProjects.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime(),
  );

  const displayed = range
    ? sorted.slice(range[0] - 1, range[1] ?? sorted.length)
    : sorted;

  return (
    <div className={styles.grid}>
      {displayed.map((post) => {
        const tag = (post.metadata.tag || "")
          .toLowerCase()
          .replace(/[^a-z]/g, "-");
        const hasImages = Array.isArray(post.metadata.images) && post.metadata.images.length > 0;
        const href = post.metadata.link || `/work/${post.slug}`;

        return (
          <Link key={post.slug} href={href} className={styles.tile}>
            <div className={styles.tileImage} data-tag={tag}>
              {hasImages ? (
                <img
                  src={post.metadata.images[0]}
                  alt={post.metadata.title}
                  className={styles.img}
                />
              ) : (
                <>
                  <div className={styles.tileContent}>
                    {post.metadata.tag && (
                      <span className={styles.tileTag}>{post.metadata.tag}</span>
                    )}
                    <span className={styles.tileLabel}>{post.metadata.title}</span>
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
