import { tool } from "ai";
import { z } from "zod";
import { zodSchema } from "@ai-sdk/provider-utils";

import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Authorized domains — only these URLs may be fetched by the web tool.
// Keep this list tight: anything outside it is rejected at the gate.
// ---------------------------------------------------------------------------
const AUTHORIZED_URLS: RegExp[] = [
  /^https?:\/\/github\.com\/fworks-tech\/.+/,
  /^https?:\/\/agenthood\.flabs\.tech(\/.*)?$/,
  /^https?:\/\/logroute-app\.vercel\.app(\/.*)?$/,
  /^https?:\/\/chain-telescope\.streamlit\.app(\/.*)?$/,
  /^https?:\/\/flabs\.tech(\/.*)?$/,
  /^https?:\/\/www\.npmjs\.com\/package\/agenthood/,
];

function isAuthorizedUrl(url: string): boolean {
  return AUTHORIZED_URLS.some((re) => re.test(url));
}

// ---------------------------------------------------------------------------
// Tool 1 — fetchGitHubRepo
// Fetches live metadata about one of Fabio's GitHub repositories.
// ---------------------------------------------------------------------------
async function fetchGitHubRepo(owner: string, repo: string) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 300 },
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
      signal: AbortSignal.timeout(10_000),
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
// Searches Fabio's blog posts and projects by title / summary.
// Returns matching entries from the static content index.
// ---------------------------------------------------------------------------
import { getPosts } from "@/lib/mdx";

async function searchContent(query: string) {
  const q = query.toLowerCase();
  const results: {
    type: string;
    title: string;
    summary: string;
    publishedAt?: string;
    link: string;
  }[] = [];

  try {
    const blogPosts = getPosts(["src", "content", "blog"]);
    const projects = getPosts(["src", "content", "projects"]);

    for (const post of blogPosts) {
      const title = (post.metadata.title as string) ?? "";
      const summary = (post.metadata.summary as string) ?? "";
      if (title.toLowerCase().includes(q) || summary.toLowerCase().includes(q)) {
        results.push({
          type: "blog",
          title,
          summary: summary.slice(0, 200),
          publishedAt: post.metadata.publishedAt,
          link: `/blog/${post.slug}`,
        });
      }
    }

    for (const project of projects) {
      const title = (project.metadata.title as string) ?? "";
      const summary = (project.metadata.summary as string) ?? "";
      if (title.toLowerCase().includes(q) || summary.toLowerCase().includes(q)) {
        results.push({
          type: "project",
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
};
