import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) =>
    <a href={href as string} {...props}>{children}</a>,
}));

const trackSpy = vi.fn();
vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => trackSpy(...args),
}));

import { TrackedButton } from "@/components/ui/TrackedButton";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("TrackedButton", () => {
  it("renders a link with the given href", () => {
    render(<TrackedButton href="/projects" eventName="cta_click">View Projects</TrackedButton>, { wrapper: Wrapper });
    const link = screen.getByRole("link", { name: "View Projects" });
    expect(link).toHaveAttribute("href", "/projects");
  });

  it("calls track on click", async () => {
    const user = userEvent.setup();
    render(<TrackedButton href="/about" eventName="cta_click" eventLabel="about-page">About</TrackedButton>, { wrapper: Wrapper });
    await user.click(screen.getByRole("link"));
    expect(trackSpy).toHaveBeenCalledWith("cta_click", { label: "about-page" });
  });

  it("falls back to href as event label", async () => {
    const user = userEvent.setup();
    trackSpy.mockClear();
    render(<TrackedButton href="/work" eventName="nav_click">Work</TrackedButton>, { wrapper: Wrapper });
    await user.click(screen.getByRole("link"));
    expect(trackSpy).toHaveBeenCalledWith("nav_click", { label: "/work" });
  });

  it("maps variant primary to filled", () => {
    render(<TrackedButton href="/" variant="primary" eventName="cta">Home</TrackedButton>, { wrapper: Wrapper });
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("maps size s to sm", () => {
    render(<TrackedButton href="/" size="s" eventName="cta">Small</TrackedButton>, { wrapper: Wrapper });
    expect(screen.getByRole("link")).toBeInTheDocument();
  });
});