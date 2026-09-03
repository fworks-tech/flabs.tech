import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPostsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mdx", () => ({
  getPosts: getPostsMock,
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

beforeEach(() => {
  getPostsMock.mockReset();
});

describe("admin drafts page", () => {
  it("lists draft and scheduled posts with preview links", async () => {
    getPostsMock.mockReturnValue([
      {
        slug: "draft-post",
        metadata: { title: "My Draft Post", draft: true, publishedAt: "2026-08-01" },
        content: "draft content",
      },
      {
        slug: "future-post",
        metadata: {
          title: "Scheduled Post",
          publishedAt: "2026-08-10",
          // Relative so the fixture stays in the future no matter when the suite runs.
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        content: "scheduled content",
      },
      {
        slug: "published-post",
        metadata: { title: "Published Post", publishedAt: "2026-07-01" },
        content: "published content",
      },
    ]);

    const { default: Page } = await import("@/app/admin/drafts/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    expect(screen.getByText("My Draft Post")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Scheduled Post")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.queryByText("Published Post")).not.toBeInTheDocument();
    const previewLinks = screen.getAllByRole("link", { name: "Preview →" });
    expect(previewLinks).toHaveLength(2);
    expect(previewLinks[0]).toHaveAttribute("href", "/admin/drafts/draft-post");
    expect(previewLinks[1]).toHaveAttribute("href", "/admin/drafts/future-post");
  });

  it("shows an empty state when nothing is hidden", async () => {
    getPostsMock.mockReturnValue([
      {
        slug: "published-post",
        metadata: { title: "Published Post", publishedAt: "2026-07-01" },
        content: "",
      },
    ]);

    const { default: Page } = await import("@/app/admin/drafts/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    expect(screen.getByText(/Nothing hidden right now/)).toBeInTheDocument();
  });
});
