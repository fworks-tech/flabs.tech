import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

vi.mock("@once-ui-system/core");
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
  style: {},
}));

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

const personAvatar = "/images/avatar.png";

describe("ProjectCard", () => {
  it("renders the title", () => {
    render(<ProjectCard {...defaultProps} />);
    const titles = screen.getAllByText("Test Project");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the description", () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("A test project description")).toBeInTheDocument();
  });

  it('renders "Read case study" link when content is provided', () => {
    render(<ProjectCard {...defaultProps} />);
    expect(screen.getByText("Read case study")).toBeInTheDocument();
  });

  it('does not render "Read case study" when content is empty', () => {
    render(<ProjectCard {...defaultProps} content="" />);
    expect(screen.queryByText("Read case study")).not.toBeInTheDocument();
  });

  it('renders "View project" link when link is provided', () => {
    render(<ProjectCard {...defaultProps} link="https://example.com" />);
    expect(screen.getByText("View project")).toBeInTheDocument();
  });

  it("renders avatars when provided", () => {
    render(<ProjectCard {...defaultProps} avatars={[{ src: personAvatar }]} />);
    expect(screen.getByTestId("AvatarGroup")).toBeInTheDocument();
  });

  it("renders visual header (no images) with tag if provided", () => {
    const { container } = render(<ProjectCard {...defaultProps} tag="React" images={[]} />);
    expect(container.querySelector('[data-tag="react"]')).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders visual header without tag when tag is absent", () => {
    render(<ProjectCard {...defaultProps} tag={undefined} />);
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("renders carousel with images", () => {
    render(<ProjectCard {...defaultProps} images={["/img1.png", "/img2.png"]} />);
    expect(screen.getByTestId("Carousel")).toBeInTheDocument();
  });
});
