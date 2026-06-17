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

  it("handles click without crashing", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const ue = userEvent.setup();
    render(<ThemeToggle />);
    await ue.click(screen.getByTestId("ToggleButton"));
    expect(screen.getByTestId("ToggleButton")).toBeInTheDocument();
  });
});
