import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const mockProjects = [
  {
    slug: "project-one",
    detailSlug: "project-one",
    title: "Project One",
    updatedAt: "2024-03-15",
    tag: "React",
    images: ["/img1.png"],
    tags: undefined,
    summary: "",
    content: "",
    link: "",
    githubUrl: "https://github.com/test/project-one",
    publishedAt: "2024-03-15",
    team: [],
  },
  {
    slug: "project-two",
    detailSlug: "project-two",
    title: "Project Two",
    updatedAt: "2024-01-10",
    tag: undefined,
    images: [],
    tags: ["TypeScript", "Next.js", "Tailwind", "GraphQL"],
    summary: "",
    content: "",
    link: "",
    githubUrl: "https://github.com/test/project-two",
    publishedAt: "2024-01-10",
    team: [],
  },
  {
    slug: "excluded",
    detailSlug: "excluded",
    title: "Excluded Project",
    updatedAt: "2024-02-20",
    tag: "",
    images: [],
    tags: undefined,
    summary: "",
    content: "",
    link: "",
    githubUrl: "https://github.com/test/excluded",
    publishedAt: "2024-02-20",
    team: [],
  },
];

vi.mock("@/lib/github-repos", () => ({
  fetchFeaturedRepos: vi.fn(() => Promise.resolve(mockProjects)),
}));

import { ProjectGrid } from "../ProjectGrid";

describe("ProjectGrid", () => {
  it("renders project tiles with image alt text", async () => {
    const { container } = render(await ProjectGrid({}));
    expect(screen.getByAltText("Project One")).toBeInTheDocument();
    expect(screen.getByText("Project Two")).toBeInTheDocument();
  });

  it("excludes projects by slug", async () => {
    render(await ProjectGrid({ exclude: ["excluded"] }));
    expect(screen.queryByAltText("Excluded Project")).not.toBeInTheDocument();
    expect(screen.getByAltText("Project One")).toBeInTheDocument();
  });

  it("applies range slicing", async () => {
    render(await ProjectGrid({ range: [1, 1] }));
    expect(screen.getByAltText("Project One")).toBeInTheDocument();
    expect(screen.queryByAltText("Project Two")).not.toBeInTheDocument();
  });

  it("renders tags list when tags array exists", async () => {
    render(await ProjectGrid({}));
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it('shows "+N" for tags beyond 3', async () => {
    render(await ProjectGrid({}));
    expect(screen.getByText("+1")).toBeInTheDocument();
  });
});
