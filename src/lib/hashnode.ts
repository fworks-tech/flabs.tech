import { logger } from "@/lib/logger";

const HASHNODE_API = "https://gql.hashnode.com";

export type HashnodeArticleInput = {
  title: string;
  bodyMarkdown: string;
  canonicalUrl: string;
  description: string;
  tags: string[];
  published?: boolean;
  slug?: string;
};

export type HashnodeArticle = {
  id: string;
  title: string;
  url: string;
  slug: string;
  publishedAt: string;
  tags: string[];
};

export class HashnodeError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "HashnodeError";
  }
}

function getToken(): string {
  const token = process.env.HASHNODE_TOKEN;
  if (!token) {
    throw new HashnodeError(
      "HASHNODE_TOKEN is not set. Get it at https://hashnode.com/settings/developer",
      401,
    );
  }
  return token;
}

let cachedPublicationId: string | null = null;

/** @internal Reset cached publication ID (used in tests) */
export function __resetClient(): void {
  cachedPublicationId = null;
}

async function getPublicationId(): Promise<string> {
  if (cachedPublicationId) {
    return cachedPublicationId;
  }

  const envId = process.env.HASHNODE_PUBLICATION_ID;
  if (envId) {
    cachedPublicationId = envId;
    return envId;
  }

  const id = await fetchPrimaryPublicationId();
  cachedPublicationId = id;
  return id;
}

async function fetchPrimaryPublicationId(): Promise<string> {
  const query = `
    query Me {
      me {
        publications(first: 1) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    }
  `;

  const result = await graphqlRequest<{
    me: {
      publications: {
        edges: Array<{
          node: { id: string; title: string };
        }>;
      };
    };
  }>(query, {});

  const first = result.me?.publications?.edges?.[0]?.node;
  if (!first?.id) {
    throw new HashnodeError(
      "No publication found for this account. Set HASHNODE_PUBLICATION_ID in your .env " +
      "(find it at https://hashnode.com/settings/publication or your blog dashboard).",
      404,
    );
  }

  logger.info({ publicationId: first.id, title: first.title }, "Auto-resolved HashNode publication ID");
  return first.id;
}

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const token = getToken();

  const response = await fetch(HASHNODE_API, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error({ status: response.status, body: text }, "HashNode API request failed");
    throw new HashnodeError(
      `HashNode API returned ${response.status}`,
      response.status,
      text,
    );
  }

  const json: { data?: T; errors?: Array<{ message: string }> } = await response.json();

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e: { message: string }) => e.message).join("; ");
    logger.error({ errors: json.errors }, "HashNode GraphQL errors");
    throw new HashnodeError(
      `HashNode GraphQL error: ${messages}`,
      400,
      json.errors,
    );
  }

  if (!json.data) {
    throw new HashnodeError("HashNode GraphQL returned empty data", 400);
  }

  return json.data;
}

function isIndexEntry(input: HashnodeArticleInput): boolean {
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
  input: HashnodeArticleInput,
): Promise<HashnodeArticle> {
  if (isIndexEntry(input)) {
    logger.info({ title: input.title }, "Skipping index entry — not suitable for HashNode");
    throw new HashnodeError("Index or overview entries are not cross-posted to HashNode", 422);
  }

  const publicationId = await getPublicationId();

  const tags = input.tags
    .slice(0, 5)
    .map((t) => t.toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean)
    .map((name) => ({ name, slug: name }));

  const slug = input.slug || input.canonicalUrl.split("/").pop() || "";

  const mutation = `
    mutation PublishPost($input: PublishPostInput!) {
      publishPost(input: $input) {
        post {
          id
          title
          url
          slug
          publishedAt
          tags {
            name
            slug
          }
        }
      }
    }
  `;

  const result = await graphqlRequest<{
    publishPost: {
      post: {
        id: string;
        title: string;
        url: string;
        slug: string;
        publishedAt: string;
        tags: Array<{ name: string; slug: string }>;
      };
    };
  }>(mutation, {
    input: {
      title: input.title,
      publicationId,
      contentMarkdown: input.bodyMarkdown,
      tags,
      canonicalUrl: input.canonicalUrl,
      slug,
      originalArticleUrl: input.canonicalUrl,
      settings: {
        deliveredFor: "flabs.tech",
        isNewsletterActivated: false,
      },
    },
  });

  logger.info(
    { hashnodeId: result.publishPost.post.id, title: result.publishPost.post.title },
    "Article published on HashNode",
  );

  return {
    id: result.publishPost.post.id,
    title: result.publishPost.post.title,
    url: result.publishPost.post.url,
    slug: result.publishPost.post.slug,
    publishedAt: result.publishPost.post.publishedAt,
    tags: result.publishPost.post.tags.map((t) => t.name),
  };
}
