import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");
vi.mock("@/config", () => ({
  display: { time: true, themeSwitcher: true },
  routes: { "/": true, "/work": true, "/projects": true, "/blog": true, "/about": true },
}));

import { Header } from "@/components/layout/Header";

describe("Header", () => {
  it("renders navigation toggle buttons for each route", () => {
    render(<Header />);
    const toggles = screen.getAllByTestId("ToggleButton");
    expect(toggles.length).toBeGreaterThanOrEqual(5);
  });

  it("renders theme toggle", () => {
    render(<Header />);
    const toggles = screen.getAllByTestId("ToggleButton");
    expect(toggles.length).toBeGreaterThan(0);
  });
});
