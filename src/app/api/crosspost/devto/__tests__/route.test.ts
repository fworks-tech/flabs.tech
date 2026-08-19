import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const devtoMock = vi.hoisted(() => {
  class DevtoError extends Error {
    status: number;
    constructor(message: string, status = 422) {
      super(message);
      this.status = status;
    }
  }
  return {
    DevtoError,
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    getMyArticles: vi.fn(),
  };
});

vi.mock("@/lib/devto", () => devtoMock);

vi.mock("@/lib/auth", () => ({
  isAuthenticated: vi.fn(async () => true),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/crosspost", () => ({
  publishToDevto: vi.fn(),
}));

vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => [
    {
      slug: "test-post",
      metadata: { title: "Test Post", publishedAt: "2026-08-01", images: [], team: [] },
      content: "Hello",
    },
  ]),
}));

import { isAuthenticated } from "@/lib/auth";
import { publishToDevto } from "@/lib/crosspost";
import { getPosts } from "@/lib/mdx";
import { POST } from "../route";

const request = (body: unknown) =>
  new NextRequest("http://localhost/api/crosspost/devto", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("POST /api/crosspost/devto", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockResolvedValue(true);
    vi.mocked(publishToDevto).mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(isAuthenticated).mockResolvedValue(false);

    const response = await POST(request({ slug: "test-post" }));

    expect(response.status).toBe(401);
  });

  it("returns 400 when the slug is missing", async () => {
    const response = await POST(request({}));

    expect(response.status).toBe(400);
  });

  it("returns 404 when the post does not exist", async () => {
    const response = await POST(request({ slug: "missing" }));

    expect(response.status).toBe(404);
  });

  it("publishes and returns the Dev.to url and id", async () => {
    vi.mocked(publishToDevto).mockResolvedValue({
      id: 99,
      slug: "test-post",
      url: "https://dev.to/flabs/test-post",
      publishedAt: "2026-08-01T00:00:00.000Z",
    });

    const response = await POST(request({ slug: "test-post" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, url: "https://dev.to/flabs/test-post", devtoId: 99 });
    expect(publishToDevto).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "test-post" }),
    );
  });

  it("returns 422 with the message when Dev.to rejects", async () => {
    vi.mocked(publishToDevto).mockRejectedValue(
      new devtoMock.DevtoError("Tags are required", 422),
    );

    const response = await POST(request({ slug: "test-post" }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toEqual({ error: "Tags are required", slug: "test-post" });
  });

  it("returns 500 on unexpected errors", async () => {
    vi.mocked(publishToDevto).mockRejectedValue(new Error("boom"));

    const response = await POST(request({ slug: "test-post" }));

    expect(response.status).toBe(500);
  });

  it("loads the post from the blog content directory", async () => {
    vi.mocked(publishToDevto).mockResolvedValue({
      id: 1,
      slug: "x",
      url: "https://dev.to/flabs/x",
      publishedAt: "2026-08-01T00:00:00.000Z",
    });

    await POST(request({ slug: "test-post" }));

    expect(getPosts).toHaveBeenCalledWith(["src", "content", "blog"]);
  });
});
