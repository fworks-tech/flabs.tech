import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");

import { HeadingLink } from "@/components/ui/HeadingLink";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("HeadingLink", () => {
  it("renders heading with correct level", () => {
    render(
      <HeadingLink id="my-heading" level={2}>
        My Title
      </HeadingLink>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("My Title");
  });

  it("renders h1 when level is 1", () => {
    render(
      <HeadingLink id="h1" level={1}>
        First
      </HeadingLink>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders h3 when level is 3", () => {
    render(
      <HeadingLink id="h3" level={3}>
        Third
      </HeadingLink>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("applies id to heading element", () => {
    render(
      <HeadingLink id="custom-id" level={2}>
        Title
      </HeadingLink>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "custom-id");
  });

  it("handles click without crashing", async () => {
    const user = userEvent.setup();
    render(
      <HeadingLink id="click-test" level={2}>
        Click Me
      </HeadingLink>,
      { wrapper: Wrapper },
    );
    await user.click(screen.getByRole("heading", { level: 2 }));
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders icon button for copy action", () => {
    render(
      <HeadingLink id="icon-test" level={2}>
        Icon
      </HeadingLink>,
      { wrapper: Wrapper },
    );
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
