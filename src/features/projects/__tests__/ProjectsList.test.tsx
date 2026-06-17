import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

vi.mock("@once-ui-system/core");
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
  style: {},
  display: {},
  mailchimp: {},
  protectedRoutes: {},
  fonts: {},
  schema: {},
  sameAs: [],
  socialSharing: [],
  effects: {},
  dataStyle: {},
}));

const mockPosts = [
  {
    slug: "alpha",
    metadata: {
      title: "Alpha Project",
      publishedAt: "2024-06-01",
      tag: "React",
      images: [],
      team: [],
      summary: "Alpha summary",
      link: "",
    },
    content: "Alpha content",
  },
  {
    slug: "beta",
    metadata: {
      title: "Beta Project",
      publishedAt: "2024-03-01",
      tag: "Vue",
      images: [],
      team: [],
      summary: "Beta summary",
      link: "",
    },
    content: "Beta content",
  },
  {
    slug: "gamma",
    metadata: {
      title: "Gamma Project",
      publishedAt: "2024-01-01",
      tag: "",
      images: [],
      team: [],
      summary: "",
      link: "https://example.com",
    },
    content: "",
  },
];

vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => mockPosts),
}));

import { ProjectsList } from "../ProjectsList";

describe("ProjectsList", () => {
  it("renders project cards", () => {
    render(<ProjectsList />);
    expect(screen.getAllByText("Alpha Project").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Beta Project").length).toBeGreaterThanOrEqual(1);
  });

  it("excludes projects by slug", () => {
    render(<ProjectsList exclude={["gamma"]} />);
    expect(screen.queryByText("Gamma Project")).not.toBeInTheDocument();
  });

  it("applies range slicing", () => {
    render(<ProjectsList range={[1, 2]} />);
    expect(screen.getAllByText("Alpha Project").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Beta Project").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Gamma Project")).not.toBeInTheDocument();
  });
});
