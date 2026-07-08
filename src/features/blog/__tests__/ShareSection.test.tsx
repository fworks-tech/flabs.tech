import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");
vi.mock("@/config", () => ({
  socialSharing: {
    display: true,
    platforms: {
      x: true,
      linkedin: true,
      facebook: false,
      pinterest: false,
      whatsapp: false,
      reddit: false,
      telegram: false,
      email: false,
      copyLink: true,
    },
  },
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

import { ShareSection } from "@/features/blog/ShareSection";

describe("ShareSection", () => {
  it("renders share text", () => {
    render(<ShareSection title="Test" url="https://example.com" />, { wrapper: Wrapper });
    expect(screen.getByText("Share this post:")).toBeInTheDocument();
  });

  it("renders share buttons", () => {
    render(<ShareSection title="Test" url="https://example.com" />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole("link");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders copy link button", () => {
    render(<ShareSection title="Test" url="https://example.com" />, { wrapper: Wrapper });
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
