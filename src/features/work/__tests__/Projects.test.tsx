import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");
vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => []),
}));
vi.mock("@/config", () => ({
  socialSharing: { display: false, platforms: {} },
}));

import { Projects } from "@/features/work/Projects";

describe("Projects", () => {
  it("renders without crashing", () => {
    const { container } = render(<Projects />);
    expect(container).toBeInTheDocument();
  });

  it("renders empty Column when no projects", () => {
    render(<Projects />);
    expect(screen.getByTestId("Column")).toBeInTheDocument();
  });
});
