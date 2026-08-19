import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { publishToDevto } from "../src/lib/crosspost";
import { isPostVisible } from "../src/lib/draft";
import { getPosts } from "../src/lib/mdx";

const root = process.cwd();
const slugFilter = process.env.CROSSPOST_SLUG?.trim() || "";
const dryRun = process.argv.includes("--dry-run");
// Dev.to rate-limits article creation to roughly one per 30s; space the
// cross-posts out so a full backfill does not hit 429.
const publishDelayMs = Number(process.env.CROSSPOST_DELAY_MS ?? 35000);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function injectDevtoIds(raw: string, id: number, url: string): string {
  const lines = raw.split("\n");
  let fenceCount = 0;
  let insertionIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      fenceCount += 1;
      if (fenceCount === 2) {
        insertionIndex = i;
        break;
      }
    }
  }
  if (insertionIndex === -1) return raw;
  lines.splice(insertionIndex, 0, `devtoId: ${id}`, `devtoUrl: "${url}"`);
  return lines.join("\n");
}

function recordDevtoIds(slug: string, id: number, url: string): void {
  const filePath = path.join(root, "src", "content", "blog", `${slug}.mdx`);
  const raw = readFileSync(filePath, "utf-8");
  const withIds = injectDevtoIds(raw, id, url);
  if (withIds !== raw) {
    writeFileSync(filePath, withIds);
    console.log(`  recorded devtoId ${id} in ${slug}.mdx`);
  }
}

async function main(): Promise<void> {
  if (!dryRun && !process.env.DEVTO_API_KEY && !process.env.OPENCODE_API_KEY) {
    console.error("DEVTO_API_KEY is not set; nothing to do.");
    process.exitCode = 1;
    return;
  }

  const posts = getPosts(["src", "content", "blog"]);
  const candidates = posts.filter(
    (post) =>
      isPostVisible(post.metadata) &&
      !post.metadata.devtoId &&
      (!slugFilter || post.slug === slugFilter),
  );

  if (candidates.length === 0) {
    console.log("No published posts without a recorded Dev.to id.");
    return;
  }

  for (const post of candidates) {
    if (dryRun) {
      console.log(`  would publish: ${post.slug}`);
      continue;
    }
    try {
      const record = await publishToDevto(post);
      recordDevtoIds(post.slug, record.id, record.url);
      console.log(`  published: ${post.slug} -> ${record.url}`);
    } catch (error) {
      console.error(`  FAILED: ${post.slug}: ${error instanceof Error ? error.message : error}`);
    }
    await sleep(publishDelayMs);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
