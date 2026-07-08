import { describe, expect, it } from "vitest";
import type { Metadata } from "@/lib/mdx";

describe("draft", () => {
  describe("isPostVisible", () => {
    it("returns true for published post", async () => {
      const { isPostVisible } = await import("@/lib/draft");
      expect(isPostVisible({ draft: false } as Metadata)).toBe(true);
    });

    it("returns false for draft post", async () => {
      const { isPostVisible } = await import("@/lib/draft");
      expect(isPostVisible({ draft: true } as Metadata)).toBe(false);
    });

    it("returns false for future scheduled post", async () => {
      const { isPostVisible } = await import("@/lib/draft");
      const future = new Date(Date.now() + 86400000).toISOString();
      expect(isPostVisible({ draft: false, scheduledAt: future } as Metadata)).toBe(false);
    });

    it("returns true for past scheduled post", async () => {
      const { isPostVisible } = await import("@/lib/draft");
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(isPostVisible({ draft: false, scheduledAt: past } as Metadata)).toBe(true);
    });
  });

  describe("filterPosts", () => {
    it("filters out drafts when includeDrafts is false", async () => {
      const { filterPosts } = await import("@/lib/draft");
      const posts = [
        { metadata: { draft: false } as Metadata, slug: "post-1" },
        { metadata: { draft: true } as Metadata, slug: "post-2" },
        { metadata: { draft: false } as Metadata, slug: "post-3" },
      ];
      const result = filterPosts(posts, false);
      expect(result).toHaveLength(2);
      expect(result.map((p) => p.slug)).toEqual(["post-1", "post-3"]);
    });

    it("returns all posts when includeDrafts is true", async () => {
      const { filterPosts } = await import("@/lib/draft");
      const posts = [
        { metadata: { draft: false } as Metadata, slug: "post-1" },
        { metadata: { draft: true } as Metadata, slug: "post-2" },
      ];
      expect(filterPosts(posts, true)).toHaveLength(2);
    });
  });
});
