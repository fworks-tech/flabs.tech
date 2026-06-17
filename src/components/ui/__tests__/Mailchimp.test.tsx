import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation");
vi.mock("@/config", () => ({
  default: {},
  baseURL: "https://flabs.tech",
  routes: {},
  style: {},
  effects: { mask: { x: 0, y: 0, radius: 1 }, gradient: {}, dots: {}, grid: {} },
  mailchimp: {
    action: "#",
    title: "Subscribe",
    description: "Get updates",
    effects: {
      mask: { x: 0, y: 0, radius: 0, cursor: true },
      gradient: { display: false },
      dots: { display: false },
      grid: { display: false },
      lines: { display: false },
    },
  },
}));
vi.mock("@/content", () => ({
  newsletter: {
    display: true,
    title: "Newsletter",
    description: "Stay in touch",
  },
}));

import { Mailchimp } from "@/components/ui/Mailchimp";

describe("Mailchimp", () => {
  it("renders the newsletter form", () => {
    render(<Mailchimp />);
    expect(screen.getByTestId("Input")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<Mailchimp />);
    expect(screen.getByText("Subscribe")).toBeInTheDocument();
  });

  it("renders newsletter description", () => {
    render(<Mailchimp />);
    expect(screen.getByText("Stay in touch")).toBeInTheDocument();
  });
});
