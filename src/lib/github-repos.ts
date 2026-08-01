import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { featuredRepos } from "@/config/projects";
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

/**
 * Fetches featured repos from GitHub and merges with MDX content.
 *
 * GitHub provides: title, description, topics, link, language, dates
 * MDX overrides: title, summary, images, content, publishedAt, team, tag, tags
 *
 * Results are cached for 1 hour via Next.js ISR revalidation.
 */
export async function fetchFeaturedRepos(): Promise<ProjectData[]> {
  const results = await Promise.all(
    featuredRepos.map(async (repo) => {
      const gh = await fetchRepo(repo.owner, repo.name);
      if (!gh) return null;

      const mdx = repo.mdxSlug ? readMDXContent(repo.mdxSlug) : null;
      const meta = mdx?.metadata;

      return {
        slug: repo.name,
        title: (meta?.title as string) || gh.name,
        summary: (meta?.summary as string) || gh.description || "",
        link: (meta?.link as string) || gh.homepage || gh.html_url,
        tag: (meta?.tag as string) || inferCategory(gh.topics, gh.language),
        tags: (meta?.tags as string[]) || gh.topics.slice(0, 6),
        images: (meta?.images as string[]) || [],
        content: mdx?.content || "",
        publishedAt: (meta?.publishedAt as string) || gh.created_at,
        team: (meta?.team as ProjectData["team"]) || [],
        githubUrl: gh.html_url,
        homepage: gh.homepage || undefined,
        language: gh.language || undefined,
        updatedAt: gh.pushed_at,
      };
    }),
  );

  return results.filter((p): p is NonNullable<typeof p> => p !== null);
}
