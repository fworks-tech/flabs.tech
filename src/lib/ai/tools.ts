import { tool } from "ai";
import { z } from "zod";
import { zodSchema } from "@ai-sdk/provider-utils";

import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Authorized domains — only these URLs may be fetched by the web tool.
// Keep this list tight: anything outside it is rejected at the gate.
// `*.flabs.tech` subdomains are first-party (atlas, agenthood, hasheyes…).
// ---------------------------------------------------------------------------
export const AUTHORIZED_URLS: RegExp[] = [
  /^https?:\/\/github\.com\/fworks-tech\/.+/,
  /^https?:\/\/([a-z0-9-]+\.)*flabs\.tech(\/.*)?$/,
  /^https?:\/\/logroute-app\.vercel\.app(\/.*)?$/,
  /^https?:\/\/www\.npmjs\.com\/package\/agenthood/,
];

export const TOOL_FETCH_TIMEOUT_MS = 10_000;

function isAuthorizedUrl(url: string): boolean {
  return AUTHORIZED_URLS.some((re) => re.test(url));
}

// ---------------------------------------------------------------------------
// Tool 1 — fetchGitHubRepo
// Fetches live metadata about one of Fabio's GitHub repositories.
// ---------------------------------------------------------------------------
async function fetchGitHubRepo(owner: string, repo: string) {
  // Tool args come from the model: constrain them to plain GitHub path
  // segments so no crafted string can escape into an unintended API path.
  const segment = /^[A-Za-z0-9_.-]+$/;
  if (!segment.test(owner) || !segment.test(repo)) {
    return { error: `Invalid GitHub repository "${owner}/${repo}"` };
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { error: `GitHub returned ${res.status} for ${owner}/${repo}` };
    }
    const data = await res.json();
    return {
      name: data.name,
      description: data.description,
      html_url: data.html_url,
      homepage: data.homepage || null,
      language: data.language,
      topics: data.topics,
      stargazers_count: data.stargazers_count,
      forks_count: data.forks_count,
      open_issues_count: data.open_issues_count,
      created_at: data.created_at,
      updated_at: data.updated_at,
      pushed_at: data.pushed_at,
      license: data.license?.spdx_id || null,
    };
  } catch (error) {
    logger.error(error, "AI tool fetchGitHubRepo failed");
    return { error: "Failed to fetch GitHub repo" };
  }
}

// ---------------------------------------------------------------------------
// Tool 2 — fetchUrlContent
// Fetches and extracts text from an authorized URL.
// ---------------------------------------------------------------------------
async function fetchUrlContent(url: string) {
  if (!isAuthorizedUrl(url)) {
    return {
      error:
        "This URL is not in the list of authorized sources. " +
        "I can only fetch content from Fabio's own sites and GitHub repos.",
    };
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "flabs-tech-assistant/1.0",
        Accept: "text/html,text/plain",
      },
      signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { error: `Failed to fetch ${url} (${res.status})` };
    }

    const contentType = res.headers.get("content-type") ?? "";
    const raw = await res.text();

    if (contentType.includes("text/html")) {
      const cleaned = raw
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return { content: cleaned.slice(0, 6_000), contentType: "html" };
    }

    return { content: raw.slice(0, 6_000), contentType: "text" };
  } catch (error) {
    logger.error(error, "AI tool fetchUrlContent failed");
    return { error: "Failed to fetch URL content" };
  }
}

// ---------------------------------------------------------------------------
// Tool 3 — searchContent
// Searches Fabio's blog posts and projects by title / summary / tags / body.
// Returns matching entries from the static content index.
// ---------------------------------------------------------------------------
import { getPosts, type Metadata } from '@/lib/mdx';

/** Merges the `tags[]` array and legacy singular `tag` into one list. */
function getTags(metadata: Metadata): string[] {
  return [...(metadata.tags ?? []), metadata.tag ?? ''].filter(Boolean);
}

function matchesQuery(
  tokens: string[],
  title: string,
  summary: string,
  tags: string[],
  content: string,
): boolean {
  const haystacks = [title.toLowerCase(), summary.toLowerCase(), content.toLowerCase().slice(0, 4000)];
  const tagHay = tags.map((t) => t.toLowerCase());
  // Multi-token AND: every token must appear in title/summary/body or match a tag.
  return tokens.every(
    (tok) =>
      haystacks.some((h) => h.includes(tok)) || tagHay.some((t) => t.includes(tok) || tok.includes(t)),
  );
}

async function searchContent(query: string) {
  const q = query.toLowerCase().trim();
  const tokens = q.split(/[^a-z0-9]+/i).filter((t) => t.length > 1);
  const keys = tokens.length > 0 ? tokens : [q];
  const results: {
    type: string;
    title: string;
    summary: string;
    publishedAt?: string;
    link: string;
  }[] = [];

  try {
    // Public surface: never surface unpublished drafts to chat visitors.
    const blogPosts = getPosts(['src', 'content', 'blog'], false);
    const projects = getPosts(['src', 'content', 'projects'], false);

    for (const post of blogPosts) {
      const title = (post.metadata.title as string) ?? '';
      const summary = (post.metadata.summary as string) ?? '';
      const tags = getTags(post.metadata);
      if (q && matchesQuery(keys, title, summary, tags, post.content ?? '')) {
        results.push({
          type: 'blog',
          title,
          summary: summary.slice(0, 200),
          publishedAt: post.metadata.publishedAt,
          link: `/blog/${post.slug}`,
        });
      }
    }

    for (const project of projects) {
      const title = (project.metadata.title as string) ?? '';
      const summary = (project.metadata.summary as string) ?? '';
      const tags = getTags(project.metadata);
      // Slug match covers queries like "atlaslink" even when metadata is thin.
      // Gated on length so single characters (e.g. "a") don't match every slug.
      const slugQuery = q.replace(/[^a-z0-9]/gi, '');
      const slugHit = slugQuery.length > 2 && project.slug.toLowerCase().includes(slugQuery);
      if (q && (slugHit || matchesQuery(keys, title, summary, tags, project.content ?? ''))) {
        results.push({
          type: 'project',
          title,
          summary: summary.slice(0, 200),
          publishedAt: project.metadata.publishedAt,
          link: `/projects/${project.slug}`,
        });
      }
    }

    results.sort((a, b) => {
      const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return bDate - aDate;
    });

    return { results: results.slice(0, 10) };
  } catch (error) {
    logger.error(error, "AI tool searchContent failed");
    return { results: [] };
  }
}

// ---------------------------------------------------------------------------
// Tool 4 — listGitHubRepos
// Lists Fabio's public GitHub repositories (non-fork), sourced live from the
// GitHub API with a short in-memory cache. This is the primary source for
// project questions: the static .mdx list is the curated subset shown on the
// site, while this tool covers every real repo.
// ---------------------------------------------------------------------------

/**
 * Repos hidden from the assistant's project knowledge even though they exist
 * on GitHub. The site's featured catalog itself is sourced from the profile
 * README (see src/lib/github-repos.ts); this denylist applies only to the
 * assistant's full-list tool: fashionista and ApolloDroid were removed from
 * the portfolio, `fworks-tech` is the profile README, and `blockchain-explorer`
 * / `fworks.tech` are experimental repos not presented as showcase work.
 */
export const EXCLUDED_REPOS = new Set([
  "fashionista",
  "ApolloDroid",
  "fworks-tech",
  "blockchain-explorer",
  "fworks.tech",
]);

export type RepoSummary = {
  name: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  updatedAt: string;
  url: string;
};

let repoCache: { at: number; repos: RepoSummary[] } | null = null;
const REPO_CACHE_TTL_MS = 5 * 60_000;

export async function listGitHubRepos(): Promise<{ repos: RepoSummary[] } | { error: string }> {
  if (repoCache && Date.now() - repoCache.at < REPO_CACHE_TTL_MS) {
    return { repos: repoCache.repos };
  }

  try {
    const res = await fetch('https://api.github.com/users/fworks-tech/repos?per_page=100&sort=updated', {
      headers: { Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { error: `GitHub returned ${res.status}` };
    }
    const data = (await res.json()) as Array<{
      name: string;
      description: string | null;
      homepage: string | null;
      language: string | null;
      topics: string[];
      stargazers_count: number;
      pushed_at: string;
      html_url: string;
      fork: boolean;
    }>;

    const repos: RepoSummary[] = data
      .filter((repo) => !repo.fork && !EXCLUDED_REPOS.has(repo.name))
      .map((repo) => ({
        name: repo.name,
        description: repo.description ? repo.description.slice(0, 160) : null,
        homepage: repo.homepage,
        language: repo.language,
        topics: (repo.topics ?? []).slice(0, 8),
        stars: repo.stargazers_count,
        updatedAt: repo.pushed_at,
        url: repo.html_url,
      }))
      .sort((a, b) => {
        const byDate = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return byDate !== 0 ? byDate : b.stars - a.stars;
      });

    repoCache = { at: Date.now(), repos };
    return { repos };
  } catch (error) {
    logger.error(error, "AI tool listGitHubRepos failed");
    return { error: "Failed to fetch GitHub repositories" };
  }
}

// ---------------------------------------------------------------------------
// Exported tool definitions — plug these into streamText({ tools })
// ---------------------------------------------------------------------------
export const aiTools = {
  fetchGitHubRepo: tool({
    description:
      "Fetch live information about one of Fabio's GitHub repositories. " +
      "Returns stars, language, description, topics, dates, and links.",
    inputSchema: zodSchema(
      z.object({
        repo: z
          .string()
          .describe("Repository name, e.g. 'agenthood', 'flabs.tech', 'logroute'"),
      }),
    ),
    execute: async ({ repo }) => {
      logger.info({ tool: "fetchGitHubRepo", repo }, "AI tool call");
      return fetchGitHubRepo("fworks-tech", repo);
    },
  }),

  fetchUrlContent: tool({
    description:
      "Fetch and read the text content of an authorized URL. " +
      "Only Fabio's own sites and GitHub repos are allowed. " +
      "Use this to answer questions about his live projects or deployed apps.",
    inputSchema: zodSchema(
      z.object({
        url: z.string().url().describe("The URL to fetch content from"),
      }),
    ),
    execute: async ({ url }) => {
      logger.info({ tool: "fetchUrlContent", url }, "AI tool call");
      return fetchUrlContent(url);
    },
  }),

  searchContent: tool({
    description:
      "Search through Fabio's blog posts and projects by keyword. " +
      "Returns matching titles, summaries, and links.",
    inputSchema: zodSchema(
      z.object({
        query: z
          .string()
          .describe("Search keyword or phrase (e.g. 'agenthood', 'GraphQL', 'accessibility')"),
      }),
    ),
    execute: async ({ query }) => {
      logger.info({ tool: "searchContent", query }, "AI tool call");
      return searchContent(query);
    },
  }),

  listGitHubRepos: tool({
    description:
      "List all of Fabio's public GitHub repositories (non-fork, curated). " +
      "Returns name, description, homepage, language, topics, stars, and " +
      "last update, sorted by most recently updated. Prefer this tool when " +
      "asked about his projects overall — the static portfolio list only " +
      "covers the curated subset shown on the site.",
    inputSchema: zodSchema(z.object({})),
    execute: async () => {
      logger.info({ tool: "listGitHubRepos" }, "AI tool call");
      return listGitHubRepos();
    },
  }),
};
