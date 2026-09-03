import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProjectGridSkeleton } from "@/features/work/ProjectGridSkeleton";

describe("ProjectGridSkeleton", () => {
  it("renders three hidden placeholder tiles with no layout shift", () => {
    const { container } = render(<ProjectGridSkeleton />);
    expect(screen.getByTestId("project-grid-skeleton")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll('[aria-hidden="true"] > div')).toHaveLength(3);
  });

  it("renders a custom tile count", () => {
    const { container } = render(<ProjectGridSkeleton count={2} />);
    expect(container.querySelectorAll('[aria-hidden="true"] > div')).toHaveLength(2);
  });
});
