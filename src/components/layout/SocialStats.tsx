import { baseURL, sameAs } from "@/config";
import { person } from "@/content";
import { logger } from "@/lib/logger";
import { Suspense } from "react";

type SocialStat = {
  platform: string;
  label: string;
  value: string | number;
  url: string;
};

async function getDevToStats(): Promise<{ articles: number } | null> {
  try {
    const devtoUrl = sameAs.devto;
    if (!devtoUrl) return null;
    const username = new URL(devtoUrl).pathname.split("/").filter(Boolean).pop();
    if (!username) return null;
    const res = await fetch(`https://dev.to/api/articles?username=${username}&per_page=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { articles: data.length };
  } catch (err) {
    logger.warn(err, "failed to fetch Dev.to stats");
    return null;
  }
}

async function getGitHubStats(): Promise<{ repos: number } | null> {
  try {
    const username = new URL(sameAs.github || "").pathname.split("/").filter(Boolean).pop();
    if (!username) return null;
    const res = await fetch(`https://api.github.com/users/${username}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { repos: data.public_repos };
  } catch (err) {
    logger.warn(err, "failed to fetch GitHub stats");
    return null;
  }
}

async function getStackOverflowStats(): Promise<{ reputation: number } | null> {
  try {
    if (!sameAs.stackoverflow) return null;
    const id = sameAs.stackoverflow.split("/").filter(Boolean).pop();
    if (!id || isNaN(Number(id))) return null;
    const res = await fetch(
      `https://api.stackexchange.com/2.3/users/${id}?order=desc&sort=reputation&site=stackoverflow&filter=total`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { reputation: data.items?.[0]?.reputation ?? 0 };
  } catch (err) {
    logger.warn(err, "failed to fetch Stack Overflow stats");
    return null;
  }
}

async function getNpmStats(): Promise<{ packages: number } | null> {
  try {
    if (!sameAs.npm) return null;
    const username = sameAs.npm.split("/").filter(Boolean).pop();
    if (!username) return null;
    const res = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=maintainer:${username}&size=0`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { packages: data.total ?? 0 };
  } catch (err) {
    logger.warn(err, "failed to fetch npm stats");
    return null;
  }
}

async function SocialStatsInner() {
  const [devto, github, stackoverflow, npm] = await Promise.all([
    getDevToStats(),
    getGitHubStats(),
    getStackOverflowStats(),
    getNpmStats(),
  ]);

  const items: SocialStat[] = [];

  if (github && sameAs.github) items.push({ platform: "github", label: "GitHub repos", value: github.repos, url: sameAs.github });
  if (devto && sameAs.devto) items.push({ platform: "devto", label: "Dev.to articles", value: devto.articles, url: sameAs.devto });
  if (stackoverflow && sameAs.stackoverflow) items.push({ platform: "stackoverflow", label: "Stack Overflow rep", value: stackoverflow.reputation.toLocaleString("en-US"), url: sameAs.stackoverflow });
  if (npm && sameAs.npm) items.push({ platform: "npm", label: "npm packages", value: npm.packages, url: sameAs.npm });

  if (items.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "24px",
        padding: "8px 16px",
        flexWrap: "wrap",
        fontSize: "0.8125rem",
        color: "var(--neutral-on-background-weak, #888)",
      }}
    >
      {items.map((stat) => (
        <a
          key={stat.platform}
          href={stat.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <span style={{ fontWeight: 600 }}>{stat.value}</span>{" "}
          <span>{stat.label}</span>
        </a>
      ))}
    </div>
  );
}

export function SocialStats() {
  return (
    <Suspense fallback={null}>
      <SocialStatsInner />
    </Suspense>
  );
}
