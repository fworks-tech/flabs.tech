import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");

import { ThemeToggle } from "@/components/layout/ThemeToggle";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("ThemeToggle", () => {
  it("renders toggle button", () => {
    render(<ThemeToggle />, { wrapper: Wrapper });
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has aria-label for accessibility", () => {
    render(<ThemeToggle />, { wrapper: Wrapper });
    expect(screen.getByRole("button")).toHaveAttribute("aria-label");
  });

  it("handles click without crashing", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const ue = userEvent.setup();
    render(<ThemeToggle />, { wrapper: Wrapper });
    await ue.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
