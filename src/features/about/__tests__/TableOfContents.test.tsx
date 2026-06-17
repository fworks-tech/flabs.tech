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

const mockStructure = [
  { title: "Introduction", display: true, items: ["Overview", "Background"] },
  { title: "Experience", display: true, items: ["Role A", "Role B"] },
  { title: "Hidden Section", display: false, items: ["Hidden Item"] },
];

const mockAbout = {
  tableOfContent: {
    display: true,
    subItems: false,
  },
};

import TableOfContents from "../TableOfContents";

describe("TableOfContents", () => {
  it("renders null when tableOfContent.display is false", () => {
    const { container } = render(
      <TableOfContents
        structure={mockStructure}
        about={{ tableOfContent: { display: false, subItems: false } }}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders visible sections", () => {
    render(<TableOfContents structure={mockStructure} about={mockAbout} />);
    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Experience")).toBeInTheDocument();
  });

  it("does not render sections with display: false", () => {
    render(<TableOfContents structure={mockStructure} about={mockAbout} />);
    expect(screen.queryByText("Hidden Section")).not.toBeInTheDocument();
  });

  it("renders subItems when configured", () => {
    render(
      <TableOfContents
        structure={mockStructure}
        about={{ tableOfContent: { display: true, subItems: true } }}
      />,
    );
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Role A")).toBeInTheDocument();
  });

  it("hides subItems when subItems is false", () => {
    render(
      <TableOfContents
        structure={mockStructure}
        about={{ tableOfContent: { display: true, subItems: false } }}
      />,
    );
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
  });
});
