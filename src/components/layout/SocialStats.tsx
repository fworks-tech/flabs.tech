import { Anchor } from "@mantine/core";
import { sameAs } from "@/config";
import { logger } from "@/lib/logger";

export const getGitHubStats = async (): Promise<{ repos: number } | null> => {
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
};

export async function SocialStats() {
  const github = await getGitHubStats();

  const items = [];

  if (github && sameAs.github) items.push({ platform: "github", label: "GitHub repos", value: github.repos, url: sameAs.github });

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
        color: "var(--mantine-color-dimmed)",
      }}
    >
      {items.map((stat) => (
        <Anchor
          key={stat.platform}
          href={stat.url}
          target="_blank"
          rel="noopener noreferrer"
          underline="never"
          c="dimmed"
        >
          <span style={{ fontWeight: 600 }}>{stat.value}</span>{" "}
          <span>{stat.label}</span>
        </Anchor>
      ))}
    </div>
  );
}
