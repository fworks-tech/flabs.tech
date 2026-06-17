import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
  style: {},
}));
vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => []),
}));

import { Posts } from "@/features/blog/Posts";
import { getPosts } from "@/lib/mdx";

const mockPosts = [
  {
    slug: "post-c",
    metadata: {
      title: "Post C",
      publishedAt: "2024-01-01",
      tag: "React",
      images: [],
      summary: "Third post",
    },
    content: "Content C",
  },
  {
    slug: "post-a",
    metadata: {
      title: "Post A",
      publishedAt: "2024-03-01",
      tag: "GraphQL",
      images: [],
      summary: "First post",
    },
    content: "Content A",
  },
  {
    slug: "post-b",
    metadata: {
      title: "Post B",
      publishedAt: "2024-02-01",
      tag: "AI",
      images: [],
      summary: "Second post",
    },
    content: "Content B",
  },
];

describe("Posts", () => {
  it("renders empty state when no posts", () => {
    const { container } = render(<Posts />);
    expect(container.firstChild).toBeNull();
  });

  describe("with posts", () => {
    beforeEach(() => {
      vi.mocked(getPosts).mockReturnValue(mockPosts);
    });

    it("renders posts sorted by date (newest first)", () => {
      render(<Posts />);
      const titles = screen.getAllByText(/^Post [ABC]$/);
      expect(titles[0]).toHaveTextContent("Post A");
    });

    it("applies range slicing", () => {
      render(<Posts range={[1, 2]} />);
      expect(screen.getAllByText(/^Post [ABC]$/).length).toBeGreaterThanOrEqual(2);
    });

    it("excludes posts by slug", () => {
      render(<Posts exclude={["post-a"]} />);
      expect(screen.queryByText("Post A")).not.toBeInTheDocument();
      expect(screen.queryByText("Post B")).toBeInTheDocument();
    });
  });
});
