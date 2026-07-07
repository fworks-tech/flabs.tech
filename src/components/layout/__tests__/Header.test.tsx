import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    <a href={href as string} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));
vi.mock("@/config", () => ({
  display: { time: true, themeSwitcher: true },
  routes: { "/": true, "/work": true, "/projects": true, "/blog": true, "/about": true },
}));

import { Header } from "@/components/layout/Header";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("Header", () => {
  it("renders navigation links for each route", () => {
    render(<Header />, { wrapper: Wrapper });
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(5);
  });

  it("renders theme toggle button", () => {
    render(<Header />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /switch to/i })).toBeInTheDocument();
  });
});
