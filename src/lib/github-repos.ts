import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { defaultFeaturedRepos, mdxSlugByRepo } from "@/config/projects";
import { logger } from "@/lib/logger";
import type { ProjectData } from "@/types/projects.types";

type GitHubRepo = {
  name: string;
  description: string;
  html_url: string;
  homepage: string;
  topics: string[];
  language: string;
  pushed_at: string;
  created_at: string;
};

const PROFILE_OWNER = "fworks-tech";
const PROFILE_README_URL = `https://raw.githubusercontent.com/${PROFILE_OWNER}/${PROFILE_OWNER}/main/README.md`;
/** Profile README revalidation window — featured membership changes rarely. */
const FEATURED_REVALIDATE = 21600; // 6 hours

let featuredNamesCache: { at: number; names: string[] } | null = null;

async function fetchRepo(owner: string, name: string): Promise<GitHubRepo | null> {
  // E2E: served by Playwright's webServer env — deterministic pages, no network.
  if (process.env.E2E_GITHUB_MOCK === "1") {
    return {
      name,
      description: "Mock repo for E2E tests",
      html_url: `https://github.com/${owner}/${name}`,
      homepage: "https://flabs.tech",
      topics: ["typescript", "nextjs"],
      language: "TypeScript",
      pushed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) {
      logger.warn({ owner, name, status: res.status }, "GitHub repo fetch failed");
      return null;
    }
    return res.json();
  } catch (error) {
    logger.error(error, "GitHub repo fetch error");
    return null;
  }
}

function readMDXContent(slug: string): { metadata: Record<string, unknown>; content: string } | null {
  const filePath = path.join(process.cwd(), "src", "content", "projects", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = matter(raw);
    return { metadata: parsed.data, content: parsed.content };
  } catch (error) {
    logger.error(error, "Failed to read MDX content for project", { slug });
    return null;
  }
}

function inferCategory(topics: string[], language: string): string {
  const lower = topics.map((t) => t.toLowerCase());
  if (lower.some((t) => ["ai", "machine-learning", "llm", "rag", "nlp"].includes(t))) return "ai";
  if (lower.some((t) => ["full-stack", "django", "fastapi", "backend"].includes(t))) return "full-stack";
  if (lower.some((t) => ["frontend", "react", "nextjs", "portfolio"].includes(t))) return "frontend";
  if (language === "Python") return "ai";
  if (language === "TypeScript" || language === "JavaScript") return "frontend";
  return "frontend";
}

function defaultRepoUrl(name: string): string {
  return `https://github.com/${PROFILE_OWNER}/${name}`;
}

/**
 * Extracts the ordered repo-name list from the profile README's
 * "Featured Projects" table. Scans lines starting at the heading and
 * collects repo links from the first markdown table it finds. Returns []
 * when the heading or table is missing so callers can fall back.
 */
export function parseFeaturedTable(markdown: string): string[] {
  const names: string[] = [];
  const headingMatch = markdown.match(/^##\s*.*Featured\s+Projects/m);
  if (!headingMatch || headingMatch.index === undefined) return names;

  const repoLinkRe = /\[[^\]]+\]\(https:\/\/github\.com\/fworks-tech\/([^/)\s]+)\)/;
  for (const line of markdown.slice(headingMatch.index).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      if (names.length > 0) break;
      continue;
    }
    const match = repoLinkRe.exec(trimmed);
    if (match) names.push(match[1]);
  }
  return names;
}

/**
 * Ordered featured repo names, sourced from the GitHub profile README's
 * Featured Projects table. Membership and order are owned by the profile,
 * so the site and profile cannot drift. Falls back to defaultFeaturedRepos
 * on any fetch/parse failure or when E2E mocks are active.
 */
export async function fetchFeaturedRepoNames(): Promise<string[]> {
  if (process.env.E2E_GITHUB_MOCK === "1") {
    return [...defaultFeaturedRepos];
  }
  if (featuredNamesCache && Date.now() - featuredNamesCache.at < FEATURED_REVALIDATE * 1000) {
    return featuredNamesCache.names;
  }
  try {
    const res = await fetch(PROFILE_README_URL, {
      next: { revalidate: FEATURED_REVALIDATE },
    });
    if (!res.ok) {
      throw new Error(`Profile README returned ${res.status}`);
    }
    const names = parseFeaturedTable(await res.text());
    if (names.length === 0) {
      throw new Error("No featured repos parsed from profile README");
    }
    featuredNamesCache = { at: Date.now(), names };
    return names;
  } catch (error) {
    logger.error(error, "Profile README featured fetch failed, using default list");
    return [...defaultFeaturedRepos];
  }
}

/**
 * Fetches featured repos named by the GitHub profile README and merges each
 * with MDX content.
 *
 * GitHub provides: title, description, topics, link, language, dates
 * MDX overrides: title, summary, images, content, publishedAt, team, tag, tags
 *
 * Display order follows the profile README table order. A repo with readable
 * MDX content is kept even when the GitHub API is unavailable, so cards and
 * detail pages never silently vanish on a GitHub outage.
 */
export async function fetchFeaturedRepos(): Promise<ProjectData[]> {
  const names = await fetchFeaturedRepoNames();
  const results = await Promise.all(
    names.map(async (name) => {
      const gh = await fetchRepo(PROFILE_OWNER, name);
      const mdxSlug = mdxSlugByRepo[name];
      const mdx = mdxSlug ? readMDXContent(mdxSlug) : null;
      const meta = mdx?.metadata;

      if (!gh && !meta) return null;

      return {
        slug: name,
        detailSlug: mdxSlug || name,
        title: (meta?.title as string) || gh?.name || name,
        summary: (meta?.summary as string) || gh?.description || "",
        link: (meta?.link as string) || gh?.homepage || gh?.html_url || "",
        tag: (meta?.tag as string) || inferCategory(gh?.topics ?? [], gh?.language ?? ""),
        tags: (meta?.tags as string[]) || (gh?.topics ?? []).slice(0, 6),
        images: (meta?.images as string[]) || [],
        content: mdx?.content || "",
        publishedAt: (meta?.publishedAt as string) || gh?.created_at || "",
        team: (meta?.team as ProjectData["team"]) || [],
        githubUrl: gh?.html_url || defaultRepoUrl(name),
        homepage: gh?.homepage || undefined,
        language: gh?.language || undefined,
        updatedAt: gh?.pushed_at || "",
      };
    }),
  );

  return results.filter((p): p is NonNullable<typeof p> => p !== null);
}
