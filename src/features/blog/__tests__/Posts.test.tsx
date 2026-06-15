import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");
vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => []),
}));

import { Posts } from "@/features/blog/Posts";

describe("Posts", () => {
  it("renders without crashing", () => {
    const { container } = render(<Posts />);
    expect(container).toBeInTheDocument();
  });

  it("renders empty state when no posts", () => {
    const { container } = render(<Posts />);
    expect(container.firstChild).toBeNull();
  });
});
