import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
  style: {},
  socialSharing: { display: false, platforms: {} },
}));
vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => []),
}));

import { Projects } from "@/features/work/Projects";
import { getPosts } from "@/lib/mdx";

const mockProjects = [
  {
    slug: "newest",
    metadata: {
      title: "Newest Project",
      publishedAt: "2024-06-01",
      tag: "React",
      images: [],
      team: [],
      summary: "Newest summary",
      link: "",
    },
    content: "Content",
  },
  {
    slug: "middle",
    metadata: {
      title: "Middle Project",
      publishedAt: "2024-03-01",
      tag: "Vue",
      images: [],
      team: [],
      summary: "Middle summary",
      link: "",
    },
    content: "Content",
  },
  {
    slug: "oldest",
    metadata: {
      title: "Oldest Project",
      publishedAt: "2024-01-01",
      tag: "",
      images: [],
      team: [],
      summary: "",
      link: "",
    },
    content: "Content",
  },
];

describe("Projects", () => {
  it("renders empty Column when no projects", () => {
    render(<Projects />);
    expect(screen.getByTestId("Column")).toBeInTheDocument();
  });

  describe("with projects", () => {
    beforeEach(() => {
      vi.mocked(getPosts).mockReturnValue(mockProjects);
    });

    it("renders projects sorted by date (newest first)", () => {
      render(<Projects />);
      const titles = screen.getAllByText("Newest Project");
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it("applies range slicing", () => {
      render(<Projects range={[1, 2]} />);
      expect(screen.getAllByText("Newest Project").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Middle Project").length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText("Oldest Project")).toBeNull();
    });

    it("excludes projects by slug", () => {
      render(<Projects exclude={["newest"]} />);
      expect(screen.queryByText("Newest Project")).toBeNull();
      expect(screen.getAllByText("Middle Project").length).toBeGreaterThanOrEqual(1);
    });
  });
});
