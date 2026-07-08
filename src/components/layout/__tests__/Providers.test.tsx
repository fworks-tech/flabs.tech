import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Providers } from "@/components/layout/Providers";

describe("Providers", () => {
  it("renders children inside MantineProvider", () => {
    render(<Providers><p>child content</p></Providers>);
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(<Providers><span>test</span></Providers>);
    expect(container.firstChild).toBeDefined();
  });
});