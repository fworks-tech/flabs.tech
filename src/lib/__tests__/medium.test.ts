import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { __resetClient, createArticle, MediumError } from "@/lib/medium";

const ORIGINAL_ENV = process.env;

const validInput = {
  title: "Test Post",
  bodyMarkdown: "## Hello\n\nThis is a test post.",
  canonicalUrl: "https://flabs.tech/blog/test-post",
  description: "A test post description",
  tags: ["testing", "typescript", "engineering"],
};

const meResponse = {
  data: { id: "user-123", name: "Test User", username: "testuser", imageUrl: "https://example.com/avatar.png" },
};

const createResponse = {
  data: {
    id: "post-456",
    title: "Test Post",
    url: "https://medium.com/@testuser/test-post-abc123",
    canonicalUrl: "https://flabs.tech/blog/test-post",
    publishedAt: "2026-07-06T12:00:00Z",
    tags: ["testing", "typescript", "engineering"],
    publishStatus: "draft",
  },
};

describe("Medium API client", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, MEDIUM_TOKEN: "medium-token-789" };
    mockFetch.mockReset();
    __resetClient();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("createArticle", () => {
    it("fetches /me to get userId on first call, then creates post", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      const result = await createArticle(validInput);

      expect(mockFetch).toHaveBeenNthCalledWith(1, "https://api.medium.com/v1/me", expect.any(Object));
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        "https://api.medium.com/v1/users/user-123/posts",
        expect.objectContaining({ method: "POST" }),
      );
      expect(result.id).toBe("post-456");
      expect(result.url).toBe("https://medium.com/@testuser/test-post-abc123");
    });

    it("sends correct headers", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      await createArticle(validInput);

      const meCall = mockFetch.mock.calls[0];
      expect(meCall[1].headers.Authorization).toBe("Bearer medium-token-789");

      const postCall = mockFetch.mock.calls[1];
      expect(postCall[1].headers.Authorization).toBe("Bearer medium-token-789");
      expect(postCall[1].headers["Content-Type"]).toBe("application/json");
    });

    it("sends markdown content format", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      await createArticle(validInput);

      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.contentFormat).toBe("markdown");
      expect(body.content).toBe(validInput.bodyMarkdown);
    });

    it("sends canonical URL and tags", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      await createArticle(validInput);

      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.canonicalUrl).toBe("https://flabs.tech/blog/test-post");
      expect(body.tags).toEqual(["testing", "typescript", "engineering"]);
    });

    it("defaults publishStatus to draft", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      await createArticle(validInput);

      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.publishStatus).toBe("draft");
    });

    it("accepts explicit publishStatus", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      await createArticle({ ...validInput, publishStatus: "public" });

      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.publishStatus).toBe("public");
    });

    it("truncates tags to 5", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      await createArticle({ ...validInput, tags: ["a", "b", "c", "d", "e", "f"] });

      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.tags).toEqual(["a", "b", "c", "d", "e"]);
    });

    it("sanitizes tags", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      await createArticle({ ...validInput, tags: ["TypeScript!", "React.js", "AI/ML"] });

      const body = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(body.tags).toEqual(["typescript", "reactjs", "aiml"]);
    });

    it("throws when MEDIUM_TOKEN is missing", async () => {
      process.env = { ...ORIGINAL_ENV };
      delete process.env.MEDIUM_TOKEN;

      await expect(createArticle(validInput)).rejects.toThrow(MediumError);
    });

    it("throws on API error", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: () => Promise.resolve("Unauthorized"),
        });

      await expect(createArticle(validInput)).rejects.toThrow(MediumError);
    });

    it("skips index or overview entries without calling API", async () => {
      await expect(
        createArticle({ ...validInput, title: "Project Index" }),
      ).rejects.toThrow(MediumError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns the created article with correct fields", async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(meResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(createResponse) });

      const result = await createArticle(validInput);

      expect(result).toEqual({
        id: "post-456",
        title: "Test Post",
        url: "https://medium.com/@testuser/test-post-abc123",
        canonicalUrl: "https://flabs.tech/blog/test-post",
        publishedAt: "2026-07-06T12:00:00Z",
        tags: ["testing", "typescript", "engineering"],
        publishStatus: "draft",
      });
    });
  });
});
