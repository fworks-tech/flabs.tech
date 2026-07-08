import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { createTweet, shareArticle, TwitterError } from "@/lib/twitter";

const ORIGINAL_ENV = process.env;

const validCredentials = {
  TWITTER_API_KEY: "api-key-123",
  TWITTER_API_SECRET: "api-secret-456",
  TWITTER_ACCESS_TOKEN: "access-token-789",
  TWITTER_ACCESS_SECRET: "access-secret-abc",
};

const tweetResponse = {
  data: { id: "tweet-123", text: "Hello world" },
};

describe("Twitter API client", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, ...validCredentials };
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("createTweet", () => {
    it("posts a tweet to /2/tweets", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tweetResponse),
      });

      const result = await createTweet({ text: "Hello world" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.twitter.com/2/tweets",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toBe("Hello world");
      expect(result.id).toBe("tweet-123");
    });

    it("includes OAuth Authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tweetResponse),
      });

      await createTweet({ text: "Hello" });

      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      expect(authHeader).toMatch(/^OAuth /);
      expect(authHeader).toContain('oauth_consumer_key="api-key-123"');
      expect(authHeader).toContain('oauth_version="1.0"');
      expect(authHeader).toContain('oauth_signature_method="HMAC-SHA1"');
    });

    it("throws on empty text", async () => {
      await expect(createTweet({ text: "" })).rejects.toThrow(TwitterError);
    });

    it("throws on text exceeding 280 characters", async () => {
      const longText = "x".repeat(281);
      await expect(createTweet({ text: longText })).rejects.toThrow(TwitterError);
    });

    it("throws when credentials are missing", async () => {
      process.env = { ...ORIGINAL_ENV };
      delete process.env.TWITTER_API_KEY;

      await expect(createTweet({ text: "Hello" })).rejects.toThrow(TwitterError);
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(createTweet({ text: "Hello" })).rejects.toThrow(TwitterError);
    });
  });

  describe("shareArticle", () => {
    it("creates a tweet with title, url, and tags", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tweetResponse),
      });

      const result = await shareArticle({
        title: "My Blog Post",
        url: "https://flabs.tech/blog/my-post",
        summary: "A great post about TypeScript",
        tags: ["typescript", "webdev"],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text).toContain("A great post about TypeScript");
      expect(body.text).toContain("My Blog Post");
      expect(body.text).toContain("https://flabs.tech/blog/my-post");
      expect(body.text).toContain("#typescript");
      expect(body.text).toContain("#webdev");
      expect(result.id).toBe("tweet-123");
    });

    it("truncates long text to 280 chars", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tweetResponse),
      });

      const longSummary = "x".repeat(300);

      await shareArticle({
        title: "My Post",
        url: "https://flabs.tech/blog/post",
        summary: longSummary,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.text.length).toBeLessThanOrEqual(280);
    });
  });
});
