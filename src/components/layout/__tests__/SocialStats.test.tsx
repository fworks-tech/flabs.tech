import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/config", () => ({
  baseURL: "https://flabs.tech",
  sameAs: {
    github: "https://github.com/fabio",
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn() },
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("network unavailable in tests"))),
  );
});

describe("SocialStats data helpers", () => {
  it(
    "getGitHubStats returns null when the API call fails",
    { timeout: 15000 },
    async () => {
      const { getGitHubStats } = await import("@/components/layout/SocialStats");
      await expect(getGitHubStats()).resolves.toBeNull();
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
            json: () => Promise.resolve({ public_repos: 42 }),
          } as Response),
        ),
      );
      const { getGitHubStats } = await import("@/components/layout/SocialStats");
      await expect(getGitHubStats()).resolves.toEqual({ repos: 42 });
    },
  );
});
