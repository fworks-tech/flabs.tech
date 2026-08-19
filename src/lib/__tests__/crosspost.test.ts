import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/devto", () => ({
  createArticle: vi.fn(),
  getMyArticles: vi.fn(),
  updateArticle: vi.fn(),
}));

import { createArticle, getMyArticles, updateArticle } from "@/lib/devto";
import { getDevtoRecord } from "@/lib/devtoStore";
import {
  buildDevtoInput,
  canonicalUrl,
  publishToDevto,
  type PostContent,
} from "@/lib/crosspost";
import type { Metadata } from "@/lib/mdx";
import { deleteDevtoRecord } from "@/lib/devtoStore";

const article = (id: number, slug: string) => ({
  id,
  title: "Test Post",
  url: `https://dev.to/flabs/${slug}`,
  canonicalUrl: canonicalUrl(slug),
  published: true,
  tags: ["ai", "engineering"],
  createdAt: "2026-08-01T00:00:00Z",
});

const baseMetadata: Metadata = {
  title: "Test Post",
  publishedAt: "2026-08-01",
  summary: "A summary",
  images: [],
  team: [],
  tags: ["ai", "engineering"],
};

const post: PostContent = {
  slug: "test-post",
  metadata: { ...baseMetadata },
  content: "## Hello\n\nBody with ![img](/images/a.webp)",
};

describe("crosspost", () => {
  beforeEach(async () => {
    vi.mocked(createArticle).mockReset();
    vi.mocked(updateArticle).mockReset();
    vi.mocked(getMyArticles).mockReset();
    await deleteDevtoRecord("test-post");
  });

  describe("buildDevtoInput", () => {
    it("builds a Dev.to input with absolute image url", () => {
      const withImage = { ...post, metadata: { ...baseMetadata, image: "/images/a.webp" } };
      const input = buildDevtoInput(withImage);
      expect(input.title).toBe("Test Post");
      expect(input.canonicalUrl).toBe("https://flabs.tech/blog/test-post");
      expect(input.mainImage).toBe("https://flabs.tech/images/a.webp");
      expect(input.published).toBe(true);
    });

    it("falls back to the single tag when tags is empty", () => {
      const input = buildDevtoInput({ ...post, metadata: { ...baseMetadata, tags: [], tag: "AI" } });
      expect(input.tags).toEqual(["AI"]);
    });

    it("leaves absolute image urls intact", () => {
      const input = buildDevtoInput({
        ...post,
        metadata: { ...baseMetadata, image: "https://cdn.example.com/hero.png" },
      });
      expect(input.mainImage).toBe("https://cdn.example.com/hero.png");
    });
  });

  describe("publishToDevto", () => {
    it("creates a new article and records the result when nothing exists", async () => {
      vi.mocked(getMyArticles).mockResolvedValue([]);
      vi.mocked(createArticle).mockResolvedValue(article(10, "test-post"));

      const record = await publishToDevto(post);

      expect(createArticle).toHaveBeenCalledWith(
        expect.objectContaining({ canonicalUrl: "https://flabs.tech/blog/test-post" }),
      );
      expect(updateArticle).not.toHaveBeenCalled();
      expect(record).toEqual({ id: 10, slug: "test-post", url: "https://dev.to/flabs/test-post", publishedAt: expect.any(String) });
      await expect(getDevtoRecord("test-post")).resolves.toEqual(record);
    });

    it("updates the article when frontmatter devtoId exists", async () => {
      vi.mocked(updateArticle).mockResolvedValue(article(42, "test-post"));

      await publishToDevto({ ...post, metadata: { ...baseMetadata, devtoId: 42 } });

      expect(updateArticle).toHaveBeenCalledWith(42, expect.any(Object));
      expect(createArticle).not.toHaveBeenCalled();
      expect(getMyArticles).not.toHaveBeenCalled();
    });

    it("updates instead of duplicating when the runtime store has a record", async () => {
      vi.mocked(updateArticle).mockResolvedValue(article(7, "test-post"));

      await publishToDevto({ ...post, metadata: { ...baseMetadata, devtoId: 7 } });
      await expect(getDevtoRecord("test-post")).resolves.toEqual(
        expect.objectContaining({ id: 7 }),
      );

      vi.mocked(updateArticle).mockReset();
      vi.mocked(updateArticle).mockResolvedValue(article(7, "test-post"));

      await publishToDevto(post);

      expect(updateArticle).toHaveBeenCalledWith(7, expect.any(Object));
      expect(createArticle).not.toHaveBeenCalled();
    });

    it("reconciles an existing article by canonical url to avoid duplicates", async () => {
      vi.mocked(getMyArticles).mockResolvedValue([article(5, "test-post")]);
      vi.mocked(updateArticle).mockResolvedValue(article(5, "test-post"));

      await publishToDevto(post);

      expect(updateArticle).toHaveBeenCalledWith(5, expect.any(Object));
      expect(createArticle).not.toHaveBeenCalled();
    });

    it("passes the published flag through", async () => {
      vi.mocked(getMyArticles).mockResolvedValue([]);
      vi.mocked(createArticle).mockResolvedValue(article(10, "test-post"));

      await publishToDevto(post, false);

      expect(createArticle).toHaveBeenCalledWith(expect.objectContaining({ published: false }));
    });
  });
});
