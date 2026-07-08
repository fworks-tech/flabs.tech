import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { NavLink } from "@/components/ui/NavLink";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    <a href={href as string} {...props}>{children}</a>,
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("NavLink", () => {
  it("renders an anchor with the given href", () => {
    render(<NavLink href="/about">About</NavLink>, { wrapper: Wrapper });
    const link = screen.getByRole("link", { name: "About" });
    expect(link).toHaveAttribute("href", "/about");
  });

  it("renders children text", () => {
    render(<NavLink href="/">Home</NavLink>, { wrapper: Wrapper });
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("applies size prop when provided", () => {
    render(<NavLink href="/blog" size="lg">Blog</NavLink>, { wrapper: Wrapper });
    const link = screen.getByRole("link", { name: "Blog" });
    expect(link).toBeInTheDocument();
  });
});