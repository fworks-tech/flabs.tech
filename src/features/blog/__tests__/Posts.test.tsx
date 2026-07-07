import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    <a href={href as string} {...props}>{children}</a>,
}));
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
  style: {},
}));
vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => []),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

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
    const { container } = render(<Posts />, { wrapper: Wrapper });
    expect(screen.queryByText("Post A")).not.toBeInTheDocument();
  });

  describe("with posts", () => {
    beforeEach(() => {
      vi.mocked(getPosts).mockReturnValue(mockPosts);
    });

    it("renders posts sorted by date (newest first)", () => {
      render(<Posts />, { wrapper: Wrapper });
      const titles = screen.getAllByText(/^Post [ABC]$/);
      expect(titles[0]).toHaveTextContent("Post A");
    });

    it("applies range slicing", () => {
      render(<Posts range={[1, 2]} />, { wrapper: Wrapper });
      expect(screen.getAllByText(/^Post [ABC]$/).length).toBeGreaterThanOrEqual(2);
    });

    it("excludes posts by slug", () => {
      render(<Posts exclude={["post-a"]} />, { wrapper: Wrapper });
      expect(screen.queryByText("Post A")).not.toBeInTheDocument();
      expect(screen.queryByText("Post B")).toBeInTheDocument();
    });
  });
});
