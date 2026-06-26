import { getPosts } from "@/lib/mdx";
import Image from "next/image";
import Link from "next/link";
import styles from "./ProjectGrid.module.scss";

interface ProjectGridProps {
  range?: [number, number?];
  exclude?: string[];
}

export function ProjectGrid({ range, exclude }: ProjectGridProps) {
  let allProjects = getPosts(["src", "content", "projects"]);

  if (exclude?.length) {
    allProjects = allProjects.filter((p) => !exclude.includes(p.slug));
  }

  const sorted = allProjects.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime(),
  );

  const displayed = range ? sorted.slice(range[0] - 1, range[1] ?? sorted.length) : sorted;

  return (
    <div className={styles.grid}>
      {displayed.map((post) => {
        const tag = (post.metadata.tag || "").toLowerCase().replace(/[^a-z]/g, "-");
        const hasImages = Array.isArray(post.metadata.images) && post.metadata.images.length > 0;

        // Validate external links to prevent XSS - only allow http/https
        let href = `/projects/${post.slug}`;
        if (post.metadata.link && typeof post.metadata.link === "string") {
          try {
            const url = new URL(post.metadata.link);
            if (url.protocol === "http:" || url.protocol === "https:") {
              // Safe URL after validation
              href = url.href;
            }
          } catch {
            // Invalid URL, fall back to default internal link
          }
        }

        // Sanitize slug for use as key
        const safeSlug = String(post.slug).replace(/[^a-z0-9-_]/gi, "");

        // Get tags - prefer 'tags' array, fall back to 'tag'
        const projectTags = Array.isArray(post.metadata.tags)
          ? post.metadata.tags
          : post.metadata.tag
            ? [post.metadata.tag]
            : [];

        return (
          <Link key={safeSlug} href={href} className={styles.tile}>
            <div className={styles.tileImage} data-tag={tag}>
              {hasImages ? (
                <Image
                  src={post.metadata.images[0]}
                  alt={post.metadata.title}
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
