import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");

import { BlogLinks } from "@/components/shared/blog-links";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

const links = {
  github: "https://github.com/fworks-tech/agenthood",
  npm: "https://www.npmjs.com/package/agenthood",
  docs: "https://fworks-tech.github.io/agenthood",
};

describe("BlogLinks", () => {
  it("renders GitHub, npm, and Docs links", () => {
    render(<BlogLinks {...links} />, { wrapper: Wrapper });

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("npm")).toBeInTheDocument();
    expect(screen.getByText("Docs")).toBeInTheDocument();
  });

  it("renders links with correct hrefs", () => {
    render(<BlogLinks {...links} />, { wrapper: Wrapper });

    expect(screen.getByText("GitHub").closest("a")).toHaveAttribute("href", links.github);
    expect(screen.getByText("npm").closest("a")).toHaveAttribute("href", links.npm);
    expect(screen.getByText("Docs").closest("a")).toHaveAttribute("href", links.docs);
  });
});
