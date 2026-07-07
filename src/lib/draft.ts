import type { Metadata } from "./mdx";

export function isPostVisible(metadata: Metadata): boolean {
  if (metadata.draft) return false;
  if (metadata.scheduledAt) {
    const scheduled = new Date(metadata.scheduledAt);
    if (scheduled > new Date()) return false;
  }
  return true;
}

export function filterPosts<T extends { metadata: Metadata }>(
  posts: T[],
  includeDrafts: boolean,
): T[] {
  if (includeDrafts) return posts;
  return posts.filter((post) => isPostVisible(post.metadata));
}
