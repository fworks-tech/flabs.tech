import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");

import { ThemeToggle } from "@/components/layout/ThemeToggle";

describe("ThemeToggle", () => {
  it("renders toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByTestId("ToggleButton")).toBeInTheDocument();
  });

  it("has aria-label for accessibility", () => {
    render(<ThemeToggle />);
    expect(screen.getByTestId("ToggleButton")).toHaveAttribute("aria-label");
  });
});
