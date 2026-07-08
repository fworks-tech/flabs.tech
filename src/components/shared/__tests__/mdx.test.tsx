import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    <a href={href as string} {...props}>{children}</a>,
}));

vi.mock("next-mdx-remote/rsc", () => ({
  MDXRemote: ({ source, components }: { source: string; components?: Record<string, React.ComponentType> }) =>
    <div data-testid="mdx-remote">{source}{components?.h1?.({ children: null }) as unknown as React.ReactNode}</div>,
}));

import { CustomMDX } from "@/components/shared/mdx";

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
});