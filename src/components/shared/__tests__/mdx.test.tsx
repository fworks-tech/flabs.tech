import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    <a href={href as string} {...props}>{children}</a>,
}));

vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source, components }: { source: string; components?: Record<string, any> }) => (
    <div data-testid="mdx-remote">
      {source}
      {components?.h1?.({ children: null }) as unknown as React.ReactNode}
      {source === "empty-src"
        ? (components?.img?.({ src: "" }) as unknown as React.ReactNode)
        : (components?.img?.({ src: "/images/article.webp", alt: "Article image" }) as unknown as React.ReactNode)}
    </div>
  ),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

import { CustomMDX } from "@/components/shared/mdx";
import { logger } from "@/lib/logger";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("CustomMDX", () => {
  it("renders MDX source content", () => {
    const { container } = render(
      <CustomMDX source="# Hello World" />,
      { wrapper: Wrapper },
    );
    expect(container.querySelector('[data-testid="mdx-remote"]')).toBeInTheDocument();
  });

  it("passes source prop through", () => {
    render(
      <CustomMDX source="**bold** text" />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText("**bold** text")).toBeInTheDocument();
  });

  it("merges custom components", () => {
    const CustomH1 = () => <h1>Custom</h1>;
    render(
      <CustomMDX source="# Title" components={{ h1: CustomH1 as any }} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("renders empty source without crashing", () => {
    const { container } = render(
      <CustomMDX source="" />,
      { wrapper: Wrapper },
    );
    expect(container.firstChild).toBeDefined();
  });

  it("renders article images through the zoomable image mapping", () => {
    render(
      <CustomMDX source="# Title" />,
      { wrapper: Wrapper },
    );
    expect(screen.getByAltText("Article image")).toHaveStyle({ transform: "scale(1)" });
  });

  it("renders nothing and logs an error for images without src", () => {
    render(
      <CustomMDX source="empty-src" />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByAltText("Article image")).not.toBeInTheDocument();
    expect(logger.error).toHaveBeenCalledWith("Media requires a valid 'src' property.");
  });
});