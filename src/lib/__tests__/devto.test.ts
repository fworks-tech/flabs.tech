import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { createArticle, DevtoError, getMyArticles, updateArticle } from "@/lib/devto";

const ORIGINAL_ENV = process.env;

const validInput = {
  title: "Test Post",
  bodyMarkdown: "## Hello\n\nThis is a test post.",
  canonicalUrl: "https://flabs.tech/blog/test-post",
  description: "A test post description",
  tags: ["testing", "typescript", "engineering"],
  published: true,
};

const apiResponse = {
  id: 123,
  title: "Test Post",
  url: "https://dev.to/testuser/test-post",
  canonical_url: "https://flabs.tech/blog/test-post",
  published: true,
  tag_list: ["testing", "typescript", "engineering"],
  created_at: "2026-07-06T12:00:00Z",
};

describe("devto API client", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, DEVTO_API_KEY: "test-key-123" };
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("createArticle", () => {
    it("posts to /api/articles with correct body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      const result = await createArticle(validInput);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.to/api/articles",
        expect.objectContaining({
          method: "POST",
          headers: {
            "api-key": "test-key-123",
            "Content-Type": "application/json",
          },
        }),
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.article.title).toBe("Test Post");
      expect(callBody.article.canonical_url).toBe("https://flabs.tech/blog/test-post");
      expect(callBody.article.tags).toEqual(["testing", "typescript", "engineering"]);
      expect(callBody.article.published).toBe(true);
      expect(result.title).toBe("Test Post");
    });

    it("returns the created article with camelCase fields", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      const result = await createArticle(validInput);

      expect(result.id).toBe(123);
      expect(result.canonicalUrl).toBe("https://flabs.tech/blog/test-post");
      expect(result.url).toBe("https://dev.to/testuser/test-post");
    });

    it("truncates tags to 4", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      await createArticle({ ...validInput, tags: ["a", "b", "c", "d", "e", "f"] });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.article.tags).toEqual(["a", "b", "c", "d"]);
    });

    it("sanitizes tags", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      await createArticle({ ...validInput, tags: ["TypeScript!", "React.js", "AI/ML"] });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.article.tags).toEqual(["typescript", "reactjs", "aiml"]);
    });

    it("throws when both DEVTO_API_KEY and OPENCODE_API_KEY are missing", async () => {
      process.env = { ...ORIGINAL_ENV };
      delete process.env.DEVTO_API_KEY;
      delete process.env.OPENCODE_API_KEY;

      await expect(createArticle(validInput)).rejects.toThrow(DevtoError);
    });

    it("falls back to OPENCODE_API_KEY when DEVTO_API_KEY is not set", async () => {
      process.env = { ...ORIGINAL_ENV, OPENCODE_API_KEY: "opencode-key-456" };
      delete process.env.DEVTO_API_KEY;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      const result = await createArticle(validInput);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.to/api/articles",
        expect.objectContaining({
          headers: expect.objectContaining({ "api-key": "opencode-key-456" }),
        }),
      );
      expect(result.id).toBe(123);
    });

    it("prefers DEVTO_API_KEY over OPENCODE_API_KEY when both are set", async () => {
      process.env = { ...ORIGINAL_ENV, DEVTO_API_KEY: "devto-key", OPENCODE_API_KEY: "opencode-key" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      await createArticle(validInput);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.to/api/articles",
        expect.objectContaining({
          headers: expect.objectContaining({ "api-key": "devto-key" }),
        }),
      );
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: () => Promise.resolve("Unprocessable"),
      });

      await expect(createArticle(validInput)).rejects.toThrow(DevtoError);
    });

    it("throws on rate limit", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve("Rate limit"),
      });

      await expect(createArticle(validInput)).rejects.toThrow(DevtoError);
    });

    it("skips index or overview entries without calling API", async () => {
      await expect(
        createArticle({ ...validInput, title: "Project Index" }),
      ).rejects.toThrow(DevtoError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("defaults published to true when undefined", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      await createArticle({ ...validInput, published: undefined });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.article.published).toBe(true);
    });
  });

  describe("updateArticle", () => {
    it("sends PUT to /api/articles/:id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(apiResponse),
      });

      await updateArticle(123, validInput);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://dev.to/api/articles/123",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  describe("getMyArticles", () => {
    it("fetches /articles/me and returns camelCase", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([apiResponse]),
      });

      const results = await getMyArticles();

      expect(results).toHaveLength(1);
      expect(results[0].canonicalUrl).toBe("https://flabs.tech/blog/test-post");
    });
  });
});
