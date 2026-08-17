import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchFeaturedRepos } from "@/lib/github-repos";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
  display: {},
  mailchimp: {},
  protectedRoutes: {},
  fonts: {},
  sameAs: [],
  socialSharing: [],
}));

const mockProjects = [
  {
    slug: "alpha",
    detailSlug: "alpha",
    title: "Alpha Project",
    updatedAt: "2024-06-01",
    tag: "React",
    images: [],
    team: [],
    summary: "Alpha summary",
    link: "",
    content: "Alpha content",
    githubUrl: "https://github.com/test/alpha",
    publishedAt: "2024-06-01",
  },
  {
    slug: "beta",
    detailSlug: "beta",
    title: "Beta Project",
    updatedAt: "2024-03-01",
    tag: "Vue",
    images: [],
    team: [],
    summary: "Beta summary",
    link: "",
    content: "Beta content",
    githubUrl: "https://github.com/test/beta",
    publishedAt: "2024-03-01",
  },
  {
    slug: "gamma",
    detailSlug: "gamma",
    title: "Gamma Project",
    updatedAt: "2024-01-01",
    tag: "",
    images: [],
    team: [],
    summary: "",
    link: "https://example.com",
    content: "",
    githubUrl: "https://github.com/test/gamma",
    publishedAt: "2024-01-01",
  },
];

vi.mock("@/lib/github-repos", () => ({
  fetchFeaturedRepos: vi.fn(() => Promise.resolve(mockProjects)),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

import { ProjectsList } from "../ProjectsList";

describe("ProjectsList", () => {
  beforeEach(() => {
    vi.mocked(fetchFeaturedRepos).mockResolvedValue(mockProjects);
  });

  it("renders project cards", async () => {
    render(await ProjectsList({}), { wrapper: Wrapper });
    expect(screen.getAllByText("Alpha Project").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Beta Project").length).toBeGreaterThanOrEqual(1);
  });

  it("excludes projects by slug", async () => {
    render(await ProjectsList({ exclude: ["gamma"] }), { wrapper: Wrapper });
    expect(screen.queryByText("Gamma Project")).not.toBeInTheDocument();
  });

  it("applies range slicing", async () => {
    render(await ProjectsList({ range: [1, 2] }), { wrapper: Wrapper });
    expect(screen.getAllByText("Alpha Project").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Beta Project").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Gamma Project")).not.toBeInTheDocument();
  });

  it("links the case-study card to the detail slug (repo name may differ)", async () => {
    vi.mocked(fetchFeaturedRepos).mockResolvedValue([
      {
        slug: "flabs.tech",
        detailSlug: "flabs-tech",
        title: "Site Project",
        updatedAt: "2024-06-01",
        tag: "Frontend",
        images: [],
        team: [],
        summary: "Site summary",
        link: "https://github.com/fworks-tech/flabs.tech",
        content: "Some body content",
        githubUrl: "https://github.com/fworks-tech/flabs.tech",
        publishedAt: "2024-06-01",
      },
    ]);
    render(await ProjectsList({}), { wrapper: Wrapper });

    const link = await screen.findByRole("link", { name: "Read case study" });
    expect(link).toHaveAttribute("href", "/projects/flabs-tech");
  });
});
