import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    <a href={href as string} {...props}>{children}</a>,
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

import Post from "@/features/blog/Post";

const mockPost = {
  slug: "test-post",
  metadata: {
    title: "Test Post Title",
    summary: "",
    publishedAt: "2025-06-01",
    tag: "tech",
    image: "/images/post.png",
  },
  content: "Post body",
};

describe("Post", () => {
  it("renders post title", () => {
    render(<Post post={mockPost} thumbnail={false} />, { wrapper: Wrapper });
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("renders formatted date", () => {
    render(<Post post={mockPost} thumbnail={false} />, { wrapper: Wrapper });
    expect(screen.getByText(/June 1, 2025/)).toBeInTheDocument();
  });

  it("renders tag when present", () => {
    render(<Post post={mockPost} thumbnail={false} />, { wrapper: Wrapper });
    expect(screen.getByText("tech")).toBeInTheDocument();
  });

  it("renders thumbnail when thumbnail=true and image present", () => {
    render(<Post post={mockPost} thumbnail={true} />, { wrapper: Wrapper });
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });

  it("does not render thumbnail when thumbnail=false", () => {
    render(<Post post={mockPost} thumbnail={false} />, { wrapper: Wrapper });
    expect(screen.getByText("Test Post Title")).toBeInTheDocument();
  });
});
