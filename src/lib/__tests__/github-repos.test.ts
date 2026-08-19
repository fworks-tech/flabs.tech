import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import { defaultFeaturedRepos } from "@/config/projects";
import { parseFeaturedTable } from "@/lib/github-repos";

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  const mocks = {
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(),
  };
  return {
    ...actual,
    ...mocks,
    default: { ...actual, ...mocks },
  };
});

type FetchHandler = (url: string) => {
  ok: boolean;
  status?: number;
  json?: unknown;
  text?: string;
};

function mockFetch(handler: FetchHandler) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const result = handler(url);
      return {
        ok: result.ok,
        status: result.status ?? 200,
        json: async () => result.json,
        text: async () => result.text ?? "",
      } as unknown as Response;
    }),
  );
}

const PROFILE_TABLE = (rows: Array<[string, string]>) =>
  [
    "## Featured Projects",
    "",
    "| Repository | Description |",
    "|---|---|",
    ...rows.map(([name, desc]) => `| [${name}](https://github.com/fworks-tech/${name}) | ${desc} |`),
    "",
  ].join("\n");

describe("parseFeaturedTable", () => {
  it("returns repo names in table order", () => {
    const md =
      `# Welcome\n\n` +
      PROFILE_TABLE([
        ["atlaslink", "landing soon"],
        ["arxiv-manager", "visual Q&A"],
      ]) +
      `\n## Recent Activity\n| [other](https://github.com/fworks-tech/other) | not featured |`;
    expect(parseFeaturedTable(md)).toEqual(["atlaslink", "arxiv-manager"]);
  });

  it("ignores description-cell links to external sites", () => {
    const md = `## Featured Projects\n\n| Repository | Description |\n|---|---|\n| [atlaslink](https://github.com/fworks-tech/atlaslink) | live at [atlas.flabs.tech](https://atlas.flabs.tech) |`;
    expect(parseFeaturedTable(md)).toEqual(["atlaslink"]);
  });

  it("returns an empty list when the heading is missing", () => {
    expect(parseFeaturedTable("# no featured heading")).toEqual([]);
    expect(parseFeaturedTable("")).toEqual([]);
  });

  it("returns an empty list when the table has no repo links", () => {
    const md = `## Featured Projects\n\n| Repository | Description |\n|---|---|\n| flabs.tech | no markdown link |`;
    expect(parseFeaturedTable(md)).toEqual([]);
  });
});

describe("fetchFeaturedRepoNames", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to the default list when the README fetch fails", async () => {
    mockFetch(() => ({ ok: false, status: 500 }));
    const { fetchFeaturedRepoNames } = await import("@/lib/github-repos");
    await expect(fetchFeaturedRepoNames()).resolves.toEqual(defaultFeaturedRepos);
  });

  it("returns parsed names from the profile README", async () => {
    mockFetch(() => ({
      ok: true,
      text: PROFILE_TABLE([
        ["alpha", "a"],
        ["beta", "b"],
      ]),
    }));
    const { fetchFeaturedRepoNames } = await import("@/lib/github-repos");
    await expect(fetchFeaturedRepoNames()).resolves.toEqual(["alpha", "beta"]);
  });

  it("falls back to the default list when the parse yields nothing", async () => {
    mockFetch(() => ({ ok: true, text: "# no table here" }));
    const { fetchFeaturedRepoNames } = await import("@/lib/github-repos");
    await expect(fetchFeaturedRepoNames()).resolves.toEqual(defaultFeaturedRepos);
  });
});

describe("fetchFeaturedRepos", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows the profile README order, not GitHub recency", async () => {
    vi.mocked(fs.readFileSync).mockReturnValue("");
    mockFetch((url) => {
      if (url.includes("README")) {
        return {
          ok: true,
          text: PROFILE_TABLE([
            ["beta", "b"],
            ["alpha", "a"],
          ]),
        };
      }
      const name = url.split("/").pop() ?? "";
      return {
        ok: true,
        json: {
          name,
          description: `${name} desc`,
          html_url: `https://github.com/fworks-tech/${name}`,
          homepage: "",
          topics: [],
          language: "TypeScript",
          pushed_at: name === "alpha" ? "2026-08-01T00:00:00Z" : "2026-01-01T00:00:00Z",
          created_at: "2025-01-01T00:00:00Z",
        },
      };
    });
    const { fetchFeaturedRepos } = await import("@/lib/github-repos");
    const result = await fetchFeaturedRepos();
    expect(result.map((p) => p.slug)).toEqual(["beta", "alpha"]);
  });

  it("keeps an MDX-backed repo when the GitHub API is down", async () => {
    vi.mocked(fs.readFileSync).mockReturnValue(
      "---\ntitle: \"Offline Agenthood\"\nsummary: \"Renders from MDX\"\n---\n\nBody",
    );
    mockFetch((url) => {
      if (url.includes("README")) {
        return {
          ok: true,
          text: PROFILE_TABLE([["agenthood", "x"]]),
        };
      }
      return { ok: false, status: 503 };
    });
    const { fetchFeaturedRepos } = await import("@/lib/github-repos");
    const result = await fetchFeaturedRepos();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("agenthood");
    expect(result[0].title).toBe("Offline Agenthood");
    expect(result[0].githubUrl).toBe("https://github.com/fworks-tech/agenthood");
  });
});
