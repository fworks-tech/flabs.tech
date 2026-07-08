import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { LinkedinError, shareArticle } from "@/lib/linkedin";

const ORIGINAL_ENV = process.env;

const shareResponse = {
  id: "share-123",
  activity: "activity-456",
};

describe("LinkedIn API client", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      LINKEDIN_ACCESS_TOKEN: "linkedin-token-abc",
      LINKEDIN_PERSON_ID: "person-789",
    };
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("shareArticle", () => {
    it("creates an article share on LinkedIn", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(shareResponse),
      });

      const result = await shareArticle({
        text: "Check out my new article!",
        articleUrl: "https://flabs.tech/blog/my-post",
        articleTitle: "My Blog Post",
        articleDescription: "A great post about TypeScript",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.linkedin.com/v2/ugcPosts",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer linkedin-token-abc",
            "LinkedIn-Version": "202501",
          }),
        }),
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.author).toBe("urn:li:person:person-789");
      expect(body.specificContent["com.linkedin.ugc.ShareContent"].shareCommentary.text).toBe("Check out my new article!");
      expect(body.specificContent["com.linkedin.ugc.ShareContent"].media[0].originalUrl).toBe("https://flabs.tech/blog/my-post");
      expect(body.specificContent["com.linkedin.ugc.ShareContent"].media[0].title.text).toBe("My Blog Post");

      expect(result.id).toBe("share-123");
    });

    it("throws when LINKEDIN_ACCESS_TOKEN is missing", async () => {
      process.env = { ...ORIGINAL_ENV };
      delete process.env.LINKEDIN_ACCESS_TOKEN;

      await expect(
        shareArticle({
          text: "Test",
          articleUrl: "https://flabs.tech/test",
          articleTitle: "Test",
        }),
      ).rejects.toThrow(LinkedinError);
    });

    it("throws when LINKEDIN_PERSON_ID is missing", async () => {
      process.env = { ...ORIGINAL_ENV, LINKEDIN_ACCESS_TOKEN: "token" };
      delete process.env.LINKEDIN_PERSON_ID;

      await expect(
        shareArticle({
          text: "Test",
          articleUrl: "https://flabs.tech/test",
          articleTitle: "Test",
        }),
      ).rejects.toThrow(LinkedinError);
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(
        shareArticle({
          text: "Test",
          articleUrl: "https://flabs.tech/test",
          articleTitle: "Test",
        }),
      ).rejects.toThrow(LinkedinError);
    });

    it("includes article thumbnail when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(shareResponse),
      });

      await shareArticle({
        text: "Check this out!",
        articleUrl: "https://flabs.tech/blog/post",
        articleTitle: "My Post",
        articleThumbnail: "https://flabs.tech/og-image.png",
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.specificContent["com.linkedin.ugc.ShareContent"].media[0].thumbnail).toBe("https://flabs.tech/og-image.png");
    });
  });
});
