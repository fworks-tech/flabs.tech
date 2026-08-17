import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ai", () => ({
  tool: (definition: unknown) => definition,
}));

vi.mock("@ai-sdk/provider-utils", () => ({
  zodSchema: (schema: unknown) => schema,
}));

vi.mock("@/lib/mdx", () => ({
  getPosts: vi.fn(() => []),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const repoPayload = [
  {
    name: "arxiv-manager",
    description: "AI-powered assistant for visual-reasoning tasks",
    homepage: null,
    language: "Python",
    topics: ["arxiv", "ai"],
    stargazers_count: 3,
    pushed_at: "2026-08-04T06:44:01Z",
    html_url: "https://github.com/fworks-tech/arxiv-manager",
    fork: false,
  },
  {
    name: "fashionista",
    description: "Should be hidden by the curation denylist",
    homepage: null,
    language: "JavaScript",
    topics: [],
    stargazers_count: 1,
    pushed_at: "2026-05-14T05:41:37Z",
    html_url: "https://github.com/fworks-tech/fashionista",
    fork: false,
  },
  {
    name: "opencode",
    description: "A fork that must be filtered out",
    homepage: null,
    language: "TypeScript",
    topics: [],
    stargazers_count: 1,
    pushed_at: "2026-08-10T00:00:00Z",
    html_url: "https://github.com/fworks-tech/opencode",
    fork: true,
  },
  {
    name: "logroute",
    description: "ELD logbook and route planner",
    homepage: "https://logroute-app.vercel.app",
    language: "TypeScript",
    topics: ["django", "react"],
    stargazers_count: 1,
    pushed_at: "2026-07-01T00:00:00Z",
    html_url: "https://github.com/fworks-tech/logroute",
    fork: false,
  },
];

async function loadTools() {
  return await import("@/lib/ai/tools");
}

describe("listGitHubRepos", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => repoPayload,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns curated, non-fork repos sorted by most recent update", async () => {
    const { listGitHubRepos } = await loadTools();
    const result = await listGitHubRepos();

    expect("repos" in result).toBe(true);
    if (!("repos" in result)) return;
    expect(result.repos.map((r) => r.name)).toEqual(["arxiv-manager", "logroute"]);
    // sorted by pushed_at desc (logroute would precede if not curated sort)
    expect(result.repos[0].name).toBe("arxiv-manager");
  });

  it("excludes forks and denylisted repos", async () => {
    const { listGitHubRepos, EXCLUDED_REPOS } = await loadTools();
    expect(EXCLUDED_REPOS).toContain("fashionista");

    const result = await listGitHubRepos();
    expect("repos" in result).toBe(true);
    if (!("repos" in result)) return;
    const names = result.repos.map((r) => r.name);
    expect(names).not.toContain("fashionista");
    expect(names).not.toContain("opencode");
  });

  it("maps compact fields", async () => {
    const { listGitHubRepos } = await loadTools();
    const result = await listGitHubRepos();

    expect("repos" in result).toBe(true);
    if (!("repos" in result)) return;
    expect(result.repos[0]).toMatchObject({
      name: "arxiv-manager",
      description: "AI-powered assistant for visual-reasoning tasks",
      homepage: null,
      language: "Python",
      topics: ["arxiv", "ai"],
      stars: 3,
      updatedAt: "2026-08-04T06:44:01Z",
      url: "https://github.com/fworks-tech/arxiv-manager",
    });
  });

  it("caches results within the TTL (single fetch)", async () => {
    const { listGitHubRepos } = await loadTools();
    const fetchMock = vi.mocked(globalThis.fetch);

    await listGitHubRepos();
    await listGitHubRepos();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error when the GitHub API responds with a non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) }),
    );
    const { listGitHubRepos } = await loadTools();

    const result = await listGitHubRepos();
    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toContain("403");
  });

  it("returns an error when the fetch itself throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const { listGitHubRepos } = await loadTools();

    const result = await listGitHubRepos();
    expect("error" in result).toBe(true);
  });
});