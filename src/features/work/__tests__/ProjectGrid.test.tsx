import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

const mockPosts = [
  {
    slug: "project-one",
    metadata: {
      title: "Project One",
      publishedAt: "2024-03-15",
      tag: "React",
      images: ["/img1.png"],
      tags: undefined,
      summary: "",
    },
    content: "",
  },
  {
    slug: "project-two",
    metadata: {
      title: "Project Two",
      publishedAt: "2024-01-10",
      tag: undefined,
      images: [],
      tags: ["TypeScript", "Next.js", "Tailwind", "GraphQL"],
      summary: "",
    },
    content: "",
  },
  {
    slug: "excluded",
    metadata: {
      title: "Excluded Project",
      publishedAt: "2024-02-20",
      tag: "",
      images: [],
      tags: undefined,
      summary: "",
    },
    content: "",
  },
];

vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => mockPosts),
}));

import { ProjectGrid } from "../ProjectGrid";

describe("ProjectGrid", () => {
  it("renders project tiles with image alt text", () => {
    render(<ProjectGrid />);
    expect(screen.getByAltText("Project One")).toBeInTheDocument();
    expect(screen.getByText("Project Two")).toBeInTheDocument();
  });

  it("excludes projects by slug", () => {
    render(<ProjectGrid exclude={["excluded"]} />);
    expect(screen.queryByAltText("Excluded Project")).not.toBeInTheDocument();
    expect(screen.getByAltText("Project One")).toBeInTheDocument();
  });

  it("applies range slicing", () => {
    render(<ProjectGrid range={[1, 1]} />);
    expect(screen.getByAltText("Project One")).toBeInTheDocument();
    expect(screen.queryByAltText("Project Two")).not.toBeInTheDocument();
  });

  it("renders tags list when tags array exists", () => {
    render(<ProjectGrid />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it('shows "+N" for tags beyond 3', () => {
    render(<ProjectGrid />);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });
});
