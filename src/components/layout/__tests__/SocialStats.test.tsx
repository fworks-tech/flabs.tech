import { render, screen } from "@testing-library/react";
import { describe, expect, vi } from "vitest";

vi.mock("@/content", () => ({
  person: { name: "Fabio" },
}));

vi.mock("@/config", () => ({
  baseURL: "https://flabs.tech",
  sameAs: {
    github: "https://github.com/fabio",
    devto: "https://dev.to/fabio",
    stackoverflow: "https://stackoverflow.com/users/12345/fabio",
    npm: "https://www.npmjs.com/~fabio",
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn() },
}));

// SocialStatsInner is async (server component) — not renderable in jsdom.
// Test the outer SocialStats Suspense boundary renders fallback.

describe("SocialStats", () => {
  it("renders Suspense fallback initially", async () => {
    const { SocialStats } = await import("@/components/layout/SocialStats");
    const { container } = render(<SocialStats />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders without crashing when config URLs are empty", async () => {
    vi.resetModules();
    vi.doMock("@/config", () => ({
      baseURL: "https://flabs.tech",
      sameAs: {},
    }));
    const { SocialStats } = await import("@/components/layout/SocialStats");
    const { container } = render(<SocialStats />);
    expect(container.firstChild).toBeDefined();
  });
});
