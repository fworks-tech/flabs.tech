import { logger } from "@/lib/logger";

const MEDIUM_API = "https://api.medium.com/v1";

export type MediumArticleInput = {
  title: string;
  bodyMarkdown: string;
  canonicalUrl: string;
  description: string;
  tags: string[];
  publishStatus?: "public" | "draft" | "unlisted";
  license?: "all-rights-reserved" | "cc-40-by" | "cc-40-by-sa" | "cc-40-by-nd" | "cc-40-by-nc" | "cc-40-by-nc-nd" | "cc-40-by-nc-sa" | "cc-40-zero" | "public-domain";
  notifyFollowers?: boolean;
};

export type MediumUser = {
  id: string;
  name: string;
  username: string;
  imageUrl: string;
};

export type MediumArticle = {
  id: string;
  title: string;
  url: string;
  canonicalUrl: string;
  publishedAt: string;
  tags: string[];
  publishStatus: string;
};

export class MediumError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "MediumError";
  }
}

function getToken(): string {
  const token = process.env.MEDIUM_TOKEN;
  if (!token) {
    throw new MediumError(
      "MEDIUM_TOKEN is not set. Get it at https://medium.com/me/settings/security",
      401,
    );
  }
  return token;
}

let cachedUserId: string | null = null;

/** @internal Reset cached user ID (used in tests) */
export function __resetClient(): void {
  cachedUserId = null;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${MEDIUM_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error({ status: response.status, body: text }, "Medium API request failed");
    throw new MediumError(
      `Medium API returned ${response.status}`,
      response.status,
      text,
    );
  }

  return response.json() as Promise<T>;
}

export async function getMe(): Promise<MediumUser> {
  const result = await request<{ data: MediumUser }>("GET", "/me");
  cachedUserId = result.data.id;
  return result.data;
}

function isIndexEntry(input: MediumArticleInput): boolean {
  const title = input.title.toLowerCase();
  const slugs = input.canonicalUrl.toLowerCase().split("/");
  const lastSlug = slugs[slugs.length - 1] || "";
  return (
    title.includes("index") ||
    lastSlug === "index" ||
    title.startsWith("about") ||
    title.startsWith("overview")
  );
}

export async function createArticle(
  input: MediumArticleInput,
): Promise<MediumArticle> {
  if (isIndexEntry(input)) {
    logger.info({ title: input.title }, "Skipping index entry — not suitable for Medium");
    throw new MediumError("Index or overview entries are not cross-posted to Medium", 422);
  }

  const userId = cachedUserId || (await getMe()).id;

  const tags = input.tags
    .slice(0, 5)
    .map((t) => t.toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean);

  const result = await request<{ data: { id: string; title: string; url: string; canonicalUrl: string; publishedAt: string; tags: string[]; publishStatus: string } }>(
    "POST",
    `/users/${userId}/posts`,
    {
      title: input.title,
      contentFormat: "markdown",
      content: input.bodyMarkdown,
      canonicalUrl: input.canonicalUrl,
      tags,
      publishStatus: input.publishStatus ?? "draft",
      description: input.description.slice(0, 200),
      license: input.license ?? "all-rights-reserved",
      notifyFollowers: input.notifyFollowers ?? false,
    },
  );

  logger.info({ mediumId: result.data.id, title: result.data.title }, "Article created on Medium");

  return {
    id: result.data.id,
    title: result.data.title,
    url: result.data.url,
    canonicalUrl: result.data.canonicalUrl,
    publishedAt: result.data.publishedAt,
    tags: result.data.tags,
    publishStatus: result.data.publishStatus,
  };
}
