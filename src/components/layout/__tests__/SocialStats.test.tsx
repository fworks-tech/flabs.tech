import { describe, expect, it, vi, beforeEach } from "vitest";

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

// SocialStats is an async Server Component — not renderable in jsdom.
// The data-fetching helpers are exported and tested here directly;
// rendering is covered by the Playwright e2e suite.

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("network unavailable in tests"))),
  );
});

describe("SocialStats data helpers", () => {
  it(
    "getDevToStats returns null when the API call fails",
    { timeout: 15000 },
    async () => {
      const { getDevToStats } = await import("@/components/layout/SocialStats");
      await expect(getDevToStats()).resolves.toBeNull();
    },
  );

  it(
    "getGitHubStats returns null when the API call fails",
    { timeout: 15000 },
    async () => {
      const { getGitHubStats } = await import("@/components/layout/SocialStats");
      await expect(getGitHubStats()).resolves.toBeNull();
    },
  );

  it(
    "getStackOverflowStats returns null when the API call fails",
    { timeout: 15000 },
    async () => {
      const { getStackOverflowStats } = await import("@/components/layout/SocialStats");
      await expect(getStackOverflowStats()).resolves.toBeNull();
    },
  );

  it(
    "getNpmStats returns null when the API call fails",
    { timeout: 15000 },
    async () => {
      const { getNpmStats } = await import("@/components/layout/SocialStats");
      await expect(getNpmStats()).resolves.toBeNull();
    },
  );

  it(
    "parses data when the API responds",
    { timeout: 15000 },
    async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ id: 1 }, { id: 2 }, { id: 3 }]),
          } as Response),
        ),
      );
      const { getDevToStats } = await import("@/components/layout/SocialStats");
      await expect(getDevToStats()).resolves.toEqual({ articles: 3 });
    },
  );
});
