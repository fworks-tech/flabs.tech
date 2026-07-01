import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core", () => {
  const React = require("react");
  return {
    SmartLink: ({ children, href, ...props }: Record<string, unknown>) =>
      React.createElement("a", { href, ...props }, children),
    Flex: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement("div", props, children),
    Text: ({ children }: Record<string, unknown>) =>
      React.createElement("span", null, children),
  };
});

import { BlogLinks } from "@/components/shared/blog-links";

const links = {
  github: "https://github.com/fworks-tech/agenthood",
  npm: "https://www.npmjs.com/package/agenthood",
  docs: "https://fworks-tech.github.io/agenthood",
};

describe("BlogLinks", () => {
  it("renders GitHub, npm, and Docs links", () => {
    render(<BlogLinks {...links} />);

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("npm")).toBeInTheDocument();
    expect(screen.getByText("Docs")).toBeInTheDocument();
  });

  it("renders links with correct hrefs", () => {
    render(<BlogLinks {...links} />);

    expect(screen.getByText("GitHub").closest("a")).toHaveAttribute("href", links.github);
    expect(screen.getByText("npm").closest("a")).toHaveAttribute("href", links.npm);
    expect(screen.getByText("Docs").closest("a")).toHaveAttribute("href", links.docs);
  });
});
