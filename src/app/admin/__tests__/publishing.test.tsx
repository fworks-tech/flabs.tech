import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPostsMock = vi.hoisted(() => vi.fn());
const listDevtoRecordsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mdx", () => ({
  getPosts: getPostsMock,
}));

vi.mock("@/lib/devtoStore", () => ({
  listDevtoRecords: listDevtoRecordsMock,
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

beforeEach(() => {
  getPostsMock.mockReset();
  listDevtoRecordsMock.mockReset();
  listDevtoRecordsMock.mockResolvedValue([]);
});

describe("admin publishing page", () => {
  it("lists posts with publish state and buttons", async () => {
    getPostsMock.mockReturnValue([
      {
        slug: "published-post",
        metadata: { title: "Published Post", publishedAt: "2026-07-01" },
        content: "",
      },
      {
        slug: "draft-post",
        metadata: { title: "Draft Post", publishedAt: "2026-08-01", draft: true },
        content: "",
      },
    ]);

    const { default: Page } = await import("@/app/admin/publishing/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    expect(screen.getByText("Published Post")).toBeInTheDocument();
    expect(screen.getByText("Draft Post")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Publish to Dev.to" })).toHaveLength(2);
    expect(screen.getAllByText("Not posted")).toHaveLength(2);
  });

  it("merges runtime dev.to records and labels recorded posts as updates", async () => {
    getPostsMock.mockReturnValue([
      {
        slug: "recorded-post",
        metadata: { title: "Recorded Post", publishedAt: "2026-07-01" },
        content: "",
      },
    ]);
    listDevtoRecordsMock.mockResolvedValue([
      { id: 7, slug: "recorded-post", url: "https://dev.to/flabs/recorded-post", publishedAt: "2026-07-02T00:00:00.000Z" },
    ]);

    const { default: Page } = await import("@/app/admin/publishing/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    const link = screen.getByRole("link", { name: "#7" });
    expect(link).toHaveAttribute("href", "https://dev.to/flabs/recorded-post");
    expect(screen.getByRole("button", { name: "Update on Dev.to" })).toBeInTheDocument();
  });

  it("uses frontmatter devtoId and devtoUrl over runtime records", async () => {
    getPostsMock.mockReturnValue([
      {
        slug: "committed-post",
        metadata: {
          title: "Committed Post",
          publishedAt: "2026-07-01",
          devtoId: 42,
          devtoUrl: "https://dev.to/flabs/committed-post",
        },
        content: "",
      },
    ]);
    listDevtoRecordsMock.mockResolvedValue([
      { id: 7, slug: "committed-post", url: "https://dev.to/flabs/old", publishedAt: "2026-07-02T00:00:00.000Z" },
    ]);

    const { default: Page } = await import("@/app/admin/publishing/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    expect(screen.getByRole("link", { name: "#42" })).toHaveAttribute(
      "href",
      "https://dev.to/flabs/committed-post",
    );
  });
});
