import { logger } from "@/lib/logger";

const DEVTO_API = "https://dev.to/api";
const API_KEY_ENV = "DEVTO_API_KEY";

export type DevtoArticleInput = {
  title: string;
  bodyMarkdown: string;
  canonicalUrl: string;
  description: string;
  tags: string[];
  published?: boolean;
  series?: string;
  mainImage?: string;
};

export type DevtoArticle = {
  id: number;
  title: string;
  url: string;
  canonicalUrl: string;
  published: boolean;
  tags: string[];
  createdAt: string;
};

export class DevtoError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "DevtoError";
  }
}

function getApiKey(): string {
  const key = process.env[API_KEY_ENV];
  if (!key) {
    throw new DevtoError(
      `${API_KEY_ENV} is not set. Get your API key at https://dev.to/settings/account`,
      401,
    );
  }
  return key;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const apiKey = getApiKey();

  const response = await fetch(`${DEVTO_API}${path}`, {
    method,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error({ status: response.status, body: text }, "Dev.to API request failed");
    throw new DevtoError(
      `Dev.to API returned ${response.status}`,
      response.status,
      text,
    );
  }

  return response.json() as Promise<T>;
}

function toDevtoSlug(slug: string): string {
  return slug
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isIndexEntry(input: DevtoArticleInput): boolean {
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
  input: DevtoArticleInput,
): Promise<DevtoArticle> {
  if (isIndexEntry(input)) {
    logger.info({ title: input.title }, "Skipping index entry — not suitable for Dev.to");
    throw new DevtoError("Index or overview entries are not cross-posted to Dev.to", 422);
  }

  const tags = input.tags
    .slice(0, 4)
    .map((t) => t.toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean);

  const slug = toDevtoSlug(input.canonicalUrl.split("/").pop() || "");

  const result = await request<{ id: number; title: string; url: string; canonical_url: string; published: boolean; tags: string[]; created_at: string }>(
    "POST",
    "/articles",
    {
      article: {
        title: input.title,
        body_markdown: input.bodyMarkdown,
        canonical_url: input.canonicalUrl,
        description: input.description.slice(0, 200),
        tags: tags.join(","),
        published: input.published ?? true,
        series: input.series || null,
        main_image: input.mainImage || null,
      },
    },
  );

  logger.info({ devtoId: result.id, title: result.title }, "Article cross-posted to Dev.to");

  return {
    id: result.id,
    title: result.title,
    url: result.url,
    canonicalUrl: result.canonical_url,
    published: result.published,
    tags: result.tags,
    createdAt: result.created_at,
  };
}

export async function updateArticle(
  id: number,
  input: DevtoArticleInput,
): Promise<DevtoArticle> {
  const tags = input.tags
    .slice(0, 4)
    .map((t) => t.toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean);

  const result = await request<{ id: number; title: string; url: string; canonical_url: string; published: boolean; tags: string[]; created_at: string }>(
    "PUT",
    `/articles/${id}`,
    {
      article: {
        title: input.title,
        body_markdown: input.bodyMarkdown,
        canonical_url: input.canonicalUrl,
        description: input.description.slice(0, 200),
        tags: tags.join(","),
        published: input.published ?? true,
        series: input.series || null,
        main_image: input.mainImage || null,
      },
    },
  );

  logger.info({ devtoId: id, title: result.title }, "Article updated on Dev.to");

  return {
    id: result.id,
    title: result.title,
    url: result.url,
    canonicalUrl: result.canonical_url,
    published: result.published,
    tags: result.tags,
    createdAt: result.created_at,
  };
}

export async function getMyArticles(): Promise<DevtoArticle[]> {
  const results = await request<Array<{ id: number; title: string; url: string; canonical_url: string; published: boolean; tags: string[]; created_at: string }>>(
    "GET",
    "/articles/me",
  );

  return results.map((a) => ({
    id: a.id,
    title: a.title,
    url: a.url,
    canonicalUrl: a.canonical_url,
    published: a.published,
    tags: a.tags,
    createdAt: a.created_at,
  }));
}
