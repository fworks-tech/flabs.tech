import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockExistsSync = vi.hoisted(() => vi.fn());
const mockReaddirSync = vi.hoisted(() => vi.fn());
const mockReadFileSync = vi.hoisted(() => vi.fn());
const mockJoin = vi.hoisted(() => vi.fn());
const mockExtname = vi.hoisted(() => vi.fn());
const mockBasename = vi.hoisted(() => vi.fn());

vi.mock("node:fs", () => ({
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
    readFileSync: mockReadFileSync,
  },
}));

vi.mock("node:path", () => ({
  join: mockJoin,
  extname: mockExtname,
  basename: mockBasename,
  default: { join: mockJoin, extname: mockExtname, basename: mockBasename },
}));

vi.mock("gray-matter");
vi.mock("next/navigation");

import { getPosts } from "../mdx";

beforeEach(() => {
  mockExistsSync.mockReturnValue(true);
  mockReaddirSync.mockReturnValue([]);
  mockReadFileSync.mockReturnValue("");
  mockJoin.mockImplementation((...args: string[]) => args.join("/"));
  mockExtname.mockImplementation((file: string) => {
    const idx = file.lastIndexOf(".");
    return idx === -1 ? "" : file.slice(idx);
  });
  mockBasename.mockImplementation((file: string, ext?: string) => {
    if (ext) return file.replace(ext, "");
    const idx = file.lastIndexOf(".");
    return idx === -1 ? file : file.slice(0, idx);
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getPosts", () => {
  it("returns posts from the given path", () => {
    mockReaddirSync.mockReturnValue(["post1.mdx", "post2.mdx"]);
    mockReadFileSync.mockReturnValue("---\ntitle: Test\npublishedAt: 2025-01-01\n---\n\nBody");
    mockExtname.mockReturnValue(".mdx");
    mockBasename.mockImplementation((file: string) => file.replace(".mdx", ""));

    const result = getPosts(["content", "blog"]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ slug: "post1" });
    expect(result[1]).toMatchObject({ slug: "post2" });
  });

  it("passes the joined path to getMDXFiles", () => {
    mockReaddirSync.mockReturnValue(["post.mdx"]);
    mockReadFileSync.mockReturnValue("---\ntitle: Post\npublishedAt: 2025-01-01\n---\n\nContent");
    mockJoin.mockReturnValue("/mock/cwd/content/blog");
    mockExtname.mockReturnValue(".mdx");

    getPosts(["content", "blog"]);

    expect(mockJoin).toHaveBeenCalled();
    expect(mockExistsSync).toHaveBeenCalledWith("/mock/cwd/content/blog");
    expect(mockReaddirSync).toHaveBeenCalledWith("/mock/cwd/content/blog");
  });

  it("returns empty array when directory is missing", () => {
    mockExistsSync.mockReturnValue(false);

    const result = getPosts(["content", "blog"]);
    expect(result).toEqual([]);
  });

  it("reads and parses each MDX file", () => {
    mockReaddirSync.mockReturnValue(["article.mdx"]);
    mockReadFileSync.mockReturnValue(
      "---\ntitle: Article\npublishedAt: 2025-06-01\n---\n\nArticle body",
    );
    mockExtname.mockReturnValue(".mdx");
    mockBasename.mockReturnValue("article");

    const result = getPosts(["content", "blog"]);

    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    expect(mockReadFileSync).toHaveBeenCalledWith(expect.stringContaining("article.mdx"), "utf-8");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("article");
    expect(result[0].content).toBe("Article body");
  });

  it("returns empty array when no .mdx files", () => {
    mockReaddirSync.mockReturnValue(["readme.txt", "image.png"]);

    const result = getPosts(["content", "blog"]);

    expect(result).toEqual([]);
  });

  it("filters only .mdx files", () => {
    mockReaddirSync.mockReturnValue(["a.mdx", "b.txt", "c.mdx"]);
    mockReadFileSync.mockReturnValue("---\ntitle: T\npublishedAt: 2025-01-01\n---\n\nB");
    mockExtname.mockImplementation((f: string) => (f.endsWith(".mdx") ? ".mdx" : ".txt"));
    mockBasename.mockImplementation((f: string) => f.replace(/\.\w+$/, ""));

    const result = getPosts(["content", "blog"]);

    expect(result).toHaveLength(2);
  });

  it("handles metadata with all fields", () => {
    mockReaddirSync.mockReturnValue(["full.mdx"]);
    mockReadFileSync.mockReturnValue(
      [
        "---",
        "title: Full Post",
        "subtitle: A subtitle",
        "publishedAt: 2025-06-01",
        "summary: A summary",
        "image: /img.png",
        "tag: tech",
        "link: https://example.com",
        "---",
        "",
        "Full body",
      ].join("\n"),
    );
    mockExtname.mockReturnValue(".mdx");
    mockBasename.mockReturnValue("full");

    const result = getPosts(["content", "blog"]);

    expect(result[0].metadata.title).toBe("Full Post");
    expect(result[0].metadata.subtitle).toBe("A subtitle");
    expect(result[0].metadata.publishedAt).toBe("2025-06-01");
    expect(result[0].metadata.summary).toBe("A summary");
    expect(result[0].metadata.image).toBe("/img.png");
    expect(result[0].metadata.tag).toBe("tech");
    expect(result[0].metadata.link).toBe("https://example.com");
    expect(result[0].content).toBe("Full body");
  });
});
