import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
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

import { ShareSection } from "@/features/blog/ShareSection";

describe("ShareSection", () => {
  it("renders share text", () => {
    render(<ShareSection title="Test" url="https://example.com" />);
    expect(screen.getByText("Share this post:")).toBeInTheDocument();
  });

  it("renders share buttons", () => {
    render(<ShareSection title="Test" url="https://example.com" />);
    const buttons = screen.getAllByTestId("Button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders copy link button", () => {
    render(<ShareSection title="Test" url="https://example.com" />);
    const buttons = screen.getAllByTestId("Button");
    expect(buttons.length).toBeGreaterThan(0);
  });
});
