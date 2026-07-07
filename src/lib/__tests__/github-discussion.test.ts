import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { announceArticle, createDiscussion, GithubDiscussionError } from "@/lib/github-discussion";

const ORIGINAL_ENV = process.env;

const createResponse = {
  data: {
    createDiscussion: {
      discussion: {
        id: "discussion-123",
        url: "https://github.com/fworks-tech/flabs.tech/discussions/1",
        title: "Test Discussion",
      },
    },
  },
};

describe("GitHub Discussions client", () => {
  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      GITHUB_TOKEN: "ghp_test-token-123",
      GITHUB_REPO_ID: "repo-456",
      GITHUB_DISCUSSION_CATEGORY_ID: "category-789",
    };
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe("createDiscussion", () => {
    it("sends GraphQL mutation to create a discussion", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createResponse),
      });

      const result = await createDiscussion({
        title: "Test Discussion",
        body: "This is a discussion body",
        categoryId: "category-789",
        repositoryId: "repo-456",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.github.com/graphql",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer ghp_test-token-123",
          }),
        }),
      );

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.query).toContain("mutation CreateDiscussion");
      expect(callBody.variables.input.title).toBe("Test Discussion");
      expect(callBody.variables.input.repositoryId).toBe("repo-456");
      expect(callBody.variables.input.categoryId).toBe("category-789");

      expect(result.id).toBe("discussion-123");
      expect(result.url).toBe("https://github.com/fworks-tech/flabs.tech/discussions/1");
    });

    it("throws when GITHUB_TOKEN is missing", async () => {
      process.env = { ...ORIGINAL_ENV };
      delete process.env.GITHUB_TOKEN;

      await expect(
        createDiscussion({
          title: "Test",
          body: "Body",
          categoryId: "cat-1",
          repositoryId: "repo-1",
        }),
      ).rejects.toThrow(GithubDiscussionError);
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      await expect(
        createDiscussion({
          title: "Test",
          body: "Body",
          categoryId: "cat-1",
          repositoryId: "repo-1",
        }),
      ).rejects.toThrow(GithubDiscussionError);
    });

    it("throws on GraphQL errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          errors: [{ message: "Validation error" }],
        }),
      });

      await expect(
        createDiscussion({
          title: "Test",
          body: "Body",
          categoryId: "cat-1",
          repositoryId: "repo-1",
        }),
      ).rejects.toThrow(GithubDiscussionError);
    });
  });

  describe("announceArticle", () => {
    it("creates a discussion with article link and tags", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createResponse),
      });

      const result = await announceArticle({
        title: "My Blog Post",
        body: "Check out my new article about TypeScript",
        url: "https://flabs.tech/blog/my-post",
        tags: ["typescript", "webdev"],
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.variables.input.title).toBe("My Blog Post");
      expect(callBody.variables.input.body).toContain("Check out my new article about TypeScript");
      expect(callBody.variables.input.body).toContain("https://flabs.tech/blog/my-post");
      expect(callBody.variables.input.body).toContain("#typescript");
      expect(result.url).toBe("https://github.com/fworks-tech/flabs.tech/discussions/1");
    });
  });
});
