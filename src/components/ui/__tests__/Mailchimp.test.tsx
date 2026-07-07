import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation");
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
  style: {},
  effects: {},
  mailchimp: {
    action: "#",
    title: "Subscribe",
    description: "Get updates",
    effects: {},
  },
}));
vi.mock("@/content", () => ({
  newsletter: {
    display: true,
    title: "Newsletter",
    description: "Stay in touch",
  },
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

import { Mailchimp } from "@/components/ui/Mailchimp";

describe("Mailchimp", () => {
  it("renders the newsletter form", () => {
    render(<Mailchimp />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<Mailchimp />, { wrapper: Wrapper });
    expect(screen.getByText("Subscribe")).toBeInTheDocument();
  });

  it("renders newsletter description", () => {
    render(<Mailchimp />, { wrapper: Wrapper });
    expect(screen.getByText("Stay in touch")).toBeInTheDocument();
  });
});
