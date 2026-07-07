import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { logger } from "@/lib/logger";

type Team = {
  name: string;
  role: string;
  avatar: string;
  linkedIn: string;
};

/** Frontmatter metadata extracted from an MDX content file. */
export type Metadata = {
  title: string;
  subtitle?: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images: string[];
  tag?: string;
  tags?: string[];
  team: Team[];
  link?: string;
  shareText?: string;
  draft?: boolean;
  scheduledAt?: string;
};

import { notFound } from "next/navigation";

function getMDXFiles(dir: string) {
  if (!fs.existsSync(dir)) {
    logger.warn({ dir }, "content directory not found");
    notFound();
  }

  try {
    return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
  } catch (error) {
    logger.error(error, "failed to read content directory");
    notFound();
  }
}

function readMDXFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    logger.warn({ filePath }, "content file not found");
    notFound();
  }

  let rawContent: string;
  try {
    rawContent = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    logger.error(error, "failed to read content file");
    notFound();
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(rawContent);
  } catch (error) {
    logger.error(error, "failed to parse frontmatter");
    notFound();
  }

  const { data, content } = parsed;

  const metadata: Metadata = {
    title: data.title || "",
    subtitle: data.subtitle || "",
    publishedAt: data.publishedAt,
    summary: data.summary || "",
    image: data.image || "",
    images: data.images || [],
    tag: data.tag || "",
    tags: data.tags || [],
    team: data.team || [],
    link: data.link || "",
    shareText: data.shareText || "",
    draft: data.draft === true,
    scheduledAt: data.scheduledAt || "",
  };

  return { metadata, content };
}

function getMDXData(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map((file) => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));

    return {
      metadata,
      slug,
      content,
    };
  });
}

/**
 * Reads all MDX content files from the specified directory path segments
 * relative to the project root.
 *
 * Each file is parsed for frontmatter metadata and MDX body content.
 * Returns the collection sorted alphabetically by slug.
 *
 * @param customPath - Directory path segments (e.g. `["src", "content", "blog"]`)
 * @returns Array of objects with `metadata`, `slug`, and `content`
 */
export function getPosts(customPath = ["", "", "", ""]) {
  const postsDir = path.join(process.cwd(), ...customPath);
  return getMDXData(postsDir);
}
