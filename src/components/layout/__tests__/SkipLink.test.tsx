import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { SkipLink } from "@/components/layout/SkipLink";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("SkipLink", () => {
  it("renders a link to #main-content", () => {
    render(<SkipLink />, { wrapper: Wrapper });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("has accessible text", () => {
    render(<SkipLink />, { wrapper: Wrapper });
    expect(screen.getByText("Skip to main content")).toBeInTheDocument();
  });
});