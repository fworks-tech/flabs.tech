import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { __resetClient, createArticle, HashnodeError } from "@/lib/hashnode";

const ORIGINAL_ENV = process.env;

const validInput = {
  title: "Test Post",
  bodyMarkdown: "## Hello\n\nThis is a test post.",
  canonicalUrl: "https://flabs.tech/blog/test-post",
  description: "A test post description",
  tags: ["testing", "typescript", "engineering"],
};

const publishResponse = {
  data: {
    publishPost: {
      post: {
        id: "post-hash-789",
        title: "Test Post",
        url: "https://testuser.hashnode.dev/test-post",
        slug: "test-post",
        publishedAt: "2026-07-06T12:00:00Z",
        tags: [{ name: "testing", slug: "testing" }, { name: "typescript", slug: "typescript" }, { name: "engineering", slug: "engineering" }],
      },
    },
  },
};

const mePublicationsResponse = {
  data: {
    me: {
      publications: {
        edges: [{ node: { id: "pub-456", title: "My Blog" } }],
      },
    },
  },
};

describe("HashNode API client", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      HASHNODE_TOKEN: "hashnode-token-abc",
      HASHNODE_PUBLICATION_ID: "pub-456",
    };
    mockFetch.mockReset();
    __resetClient();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("createArticle", () => {
    it("sends GraphQL mutation to publishPost", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(publishResponse),
      });

      const result = await createArticle(validInput);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://gql.hashnode.com",
        expect.objectContaining({ method: "POST" }),
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain("mutation PublishPost");
      expect(callBody.variables.input.title).toBe("Test Post");
      expect(callBody.variables.input.publicationId).toBe("pub-456");
      expect(callBody.variables.input.contentMarkdown).toBe("## Hello\n\nThis is a test post.");
      expect(callBody.variables.input.canonicalUrl).toBe("https://flabs.tech/blog/test-post");

      expect(result.id).toBe("post-hash-789");
      expect(result.url).toBe("https://testuser.hashnode.dev/test-post");
    });

    it("sends correct auth header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(publishResponse),
      });

      await createArticle(validInput);

      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("hashnode-token-abc");
    });

    it("formats tags as name/slug objects, max 5", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(publishResponse),
      });

      await createArticle({ ...validInput, tags: ["a", "b", "c", "d", "e", "f"] });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables.input.tags).toEqual([
        { name: "a", slug: "a" },
        { name: "b", slug: "b" },
        { name: "c", slug: "c" },
        { name: "d", slug: "d" },
        { name: "e", slug: "e" },
      ]);
    });

    it("sanitizes tags", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(publishResponse),
      });

      await createArticle({ ...validInput, tags: ["TypeScript!", "React.js", "AI/ML"] });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables.input.tags).toEqual([
        { name: "typescript", slug: "typescript" },
        { name: "reactjs", slug: "reactjs" },
        { name: "aiml", slug: "aiml" },
      ]);
    });

    it("uses custom slug when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(publishResponse),
      });

      await createArticle({ ...validInput, slug: "my-custom-slug" });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables.input.slug).toBe("my-custom-slug");
    });

    it("derives slug from canonicalUrl when not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(publishResponse),
      });

      await createArticle(validInput);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables.input.slug).toBe("test-post");
    });

    it("throws when HASHNODE_TOKEN is missing", async () => {
      process.env = { ...ORIGINAL_ENV };
      delete process.env.HASHNODE_TOKEN;
      process.env.HASHNODE_PUBLICATION_ID = "pub-456";

      await expect(createArticle(validInput)).rejects.toThrow(HashnodeError);
    });

    it("throws when HASHNODE_PUBLICATION_ID is missing and no publications found via API", async () => {
      process.env = { ...ORIGINAL_ENV, HASHNODE_TOKEN: "token" };
      delete process.env.HASHNODE_PUBLICATION_ID;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          data: { me: { publications: { edges: [] } } },
        }),
      });

      await expect(createArticle(validInput)).rejects.toThrow(HashnodeError);
    });

    it("fetches publication ID from API when env var is missing", async () => {
      process.env = { ...ORIGINAL_ENV, HASHNODE_TOKEN: "token" };
      delete process.env.HASHNODE_PUBLICATION_ID;

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mePublicationsResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(publishResponse) });

      const result = await createArticle(validInput);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const firstCall = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(firstCall.query).toContain("query Me");
      expect(result.id).toBe("post-hash-789");
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(createArticle(validInput)).rejects.toThrow(HashnodeError);
    });

    it("throws on GraphQL errors in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          errors: [{ message: "Validation error: title is required" }],
        }),
      });

      await expect(createArticle(validInput)).rejects.toThrow(HashnodeError);
    });

    it("throws on empty data response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await expect(createArticle(validInput)).rejects.toThrow(HashnodeError);
    });

    it("skips index or overview entries without calling API", async () => {
      await expect(
        createArticle({ ...validInput, title: "Project Index" }),
      ).rejects.toThrow(HashnodeError);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("sends originalArticleUrl equal to canonicalUrl", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(publishResponse),
      });

      await createArticle(validInput);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables.input.originalArticleUrl).toBe("https://flabs.tech/blog/test-post");
    });
  });
});
