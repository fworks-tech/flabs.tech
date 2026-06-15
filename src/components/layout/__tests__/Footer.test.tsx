import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");

import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders copyright with current year", () => {
    render(<Footer />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument();
  });

  it("renders person name", () => {
    render(<Footer />);
    expect(screen.getByText(/Fabio Ritzel Borges/)).toBeInTheDocument();
  });
});
