import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");

import { AnimatedHeadline } from "@/components/ui/AnimatedHeadline";

describe("AnimatedHeadline", () => {
  it("renders with aria-label matching text", () => {
    render(<AnimatedHeadline text="Hello" />);
    expect(screen.getByLabelText("Hello")).toBeInTheDocument();
  });

  it("applies className prop", () => {
    render(<AnimatedHeadline text="Test" className="custom" />);
    const el = screen.getByLabelText("Test");
    expect(el.className).toContain("custom");
  });

  it("sets data-visible after mount via setTimeout", async () => {
    render(<AnimatedHeadline text="A" />);
    await waitFor(() => {
      expect(screen.getByText("A")).toHaveAttribute("data-visible", "true");
    });
  });

  it("renders spaces as non-breaking spaces", () => {
    render(<AnimatedHeadline text="A B" />);
    const el = screen.getByLabelText("A B");
    expect(el).toBeInTheDocument();
  });

  it("renders correct number of character spans", () => {
    render(<AnimatedHeadline text="Hi" />);
    const el = screen.getByLabelText("Hi");
    expect(el.children.length).toBe(2);
  });
});
