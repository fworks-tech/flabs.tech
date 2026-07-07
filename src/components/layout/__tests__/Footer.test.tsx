import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");

import { Footer } from "@/components/layout/Footer";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("Footer", () => {
  it("renders copyright with current year", () => {
    render(<Footer />, { wrapper: Wrapper });
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument();
  });

  it("renders person name", () => {
    render(<Footer />, { wrapper: Wrapper });
    expect(screen.getByText(/Fabio Ritzel Borges/)).toBeInTheDocument();
  });
});
