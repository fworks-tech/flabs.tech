import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    <a href={href as string} {...props}>{children}</a>,
}));
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

import { ProjectCard } from "../ProjectCard";

const defaultProps = {
  href: "/work/test",
  images: [] as string[],
  title: "Test Project",
  content: "Content goes here",
  description: "A test project description",
  avatars: [] as { src: string }[],
  link: "",
};

describe("ProjectCard", () => {
  it("renders the title", () => {
    render(<ProjectCard {...defaultProps} />, { wrapper: Wrapper });
    const titles = screen.getAllByText("Test Project");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the description", () => {
    render(<ProjectCard {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText("A test project description")).toBeInTheDocument();
  });

  it('renders "Read case study" link when content is provided', () => {
    render(<ProjectCard {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText("Read case study")).toBeInTheDocument();
  });

  it('does not render "Read case study" when content is empty', () => {
    render(<ProjectCard {...defaultProps} content="" />, { wrapper: Wrapper });
    expect(screen.queryByText("Read case study")).not.toBeInTheDocument();
  });

  it('renders "View project" link when link is provided', () => {
    render(<ProjectCard {...defaultProps} link="https://example.com" />, { wrapper: Wrapper });
    expect(screen.getByText("View project")).toBeInTheDocument();
  });

  it("hides links and shows a coming soon badge when comingSoon is set", () => {
    render(<ProjectCard {...defaultProps} link="https://example.com" comingSoon />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByText("Read case study")).not.toBeInTheDocument();
    expect(screen.queryByText("View project")).not.toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("appends (coming soon) to the description when comingSoon is set", () => {
    render(<ProjectCard {...defaultProps} comingSoon />, { wrapper: Wrapper });
    expect(screen.getByText("A test project description (coming soon)")).toBeInTheDocument();
  });

  it("renders avatars when provided", () => {
    render(<ProjectCard {...defaultProps} avatars={[{ src: "/images/avatar.png" }]} />, { wrapper: Wrapper });
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("renders visual header with tag if provided", () => {
    const { container } = render(<ProjectCard {...defaultProps} tag="React" images={[]} />, { wrapper: Wrapper });
    expect(container.querySelector('[data-tag="react"]')).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders visual header without tag when tag is absent", () => {
    render(<ProjectCard {...defaultProps} tag={undefined} />, { wrapper: Wrapper });
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("renders carousel with images", () => {
    render(<ProjectCard {...defaultProps} images={["/img1.png", "/img2.png"]} />, { wrapper: Wrapper });
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("marks the first carousel image high priority when priority is set", () => {
    const { container } = render(
      <ProjectCard {...defaultProps} images={["/img1.png", "/img2.png"]} priority />,
      { wrapper: Wrapper },
    );
    const imgs = container.querySelectorAll('img[alt^="Screenshot of"]');
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("fetchpriority", "high");
    expect(imgs[1]).toHaveAttribute("fetchpriority", "auto");
  });

  it("leaves carousel images at auto priority by default", () => {
    const { container } = render(
      <ProjectCard {...defaultProps} images={["/img1.png"]} />,
      { wrapper: Wrapper },
    );
    expect(container.querySelector('img[alt^="Screenshot of"]')).toHaveAttribute(
      "fetchpriority",
      "auto",
    );
  });
});
