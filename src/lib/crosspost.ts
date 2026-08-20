import {
  createArticle,
  getMyArticles,
  updateArticle,
  type DevtoArticle,
  type DevtoArticleInput,
} from "@/lib/devto";
import {
  getDevtoRecord,
  saveDevtoRecord,
  type DevtoRecord,
} from "@/lib/devtoStore";
import { DEFAULT_BASE_URL, mdxToMarkdown } from "@/lib/mdxToMarkdown";
import type { Metadata } from "@/lib/mdx";

export type PostContent = {
  slug: string;
  metadata: Metadata;
  content: string;
};

export function canonicalUrl(slug: string): string {
  return `${DEFAULT_BASE_URL}/blog/${slug}`;
}

function absolutize(url: string): string {
  return url.startsWith("/") ? `${DEFAULT_BASE_URL}${url}` : url;
}

/**
 * Maps the site's broad content tags to a small set of well-known Dev.to
 * tags, which is what actually drives tag feeds and discovery on the
 * platform. A single generic tag (e.g. "AI") is otherwise low-signal.
 */
const DEVTO_TAG_MAP: Record<string, string[]> = {
  ai: ["ai", "webdev", "programming"],
  engineering: ["engineering", "webdev", "programming"],
  architecture: ["architecture", "webdev", "programming"],
  projects: ["showdev", "javascript", "webdev"],
};

function resolveTags(metadata: Metadata): string[] {
  if (metadata.tags?.length) return metadata.tags;
  if (metadata.tag) {
    const key = metadata.tag.toLowerCase();
    return DEVTO_TAG_MAP[key] ?? [metadata.tag];
  }
  return [];
}

/** Builds a Dev.to article input from a site blog post. */
export function buildDevtoInput(
  post: PostContent,
  published = true,
): DevtoArticleInput {
  const metadata = post.metadata;
  return {
    title: metadata.title,
    bodyMarkdown: mdxToMarkdown(post.content),
    canonicalUrl: canonicalUrl(post.slug),
    description: metadata.summary || "",
    tags: [...new Set(resolveTags(metadata))].filter(Boolean),
    published,
    mainImage: metadata.image ? absolutize(metadata.image) : undefined,
  };
}

/**
 * Resolves the Dev.to article id a post already maps to, so a re-run updates
 * instead of silently duplicating. Checks, in order: frontmatter `devtoId`,
 * the runtime record store, then a reconciliation against the account's
 * published articles by canonical URL.
 */
async function findExistingId(post: PostContent): Promise<number | undefined> {
  if (post.metadata.devtoId) return post.metadata.devtoId;
  const stored = await getDevtoRecord(post.slug);
  if (stored) return stored.id;
  const mine = await getMyArticles();
  return mine.find((article) => article.canonicalUrl === canonicalUrl(post.slug))?.id;
}

/**
 * Publishes (or updates) a post on Dev.to and records the result.
 *
 * Idempotent: if the post already maps to a Dev.to article — via frontmatter
 * `devtoId`, the runtime store, or Dev.to's own article list — the existing
 * article is updated rather than re-created.
 */
export async function publishToDevto(
  post: PostContent,
  published = true,
): Promise<DevtoRecord> {
  const input = buildDevtoInput(post, published);
  const existingId = await findExistingId(post);
  const article: DevtoArticle = existingId
    ? await updateArticle(existingId, input)
    : await createArticle(input);
  const record: DevtoRecord = {
    id: article.id,
    slug: post.slug,
    url: article.url,
    publishedAt: new Date().toISOString(),
  };
  await saveDevtoRecord(record);
  return record;
}
