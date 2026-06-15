import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");

import { HeadingLink } from "@/components/ui/HeadingLink";

describe("HeadingLink", () => {
  it("renders heading with correct level", () => {
    render(
      <HeadingLink id="my-heading" level={2}>
        My Title
      </HeadingLink>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("My Title");
  });

  it("renders h1 when level is 1", () => {
    render(
      <HeadingLink id="h1" level={1}>
        First
      </HeadingLink>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders h3 when level is 3", () => {
    render(
      <HeadingLink id="h3" level={3}>
        Third
      </HeadingLink>,
    );
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("applies id to heading element", () => {
    render(
      <HeadingLink id="custom-id" level={2}>
        Title
      </HeadingLink>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "custom-id");
  });
});
