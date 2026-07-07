import { logger } from "@/lib/logger";

const GITHUB_API = "https://api.github.com";

export type GithubDiscussionInput = {
  title: string;
  body: string;
  categoryId: string;
  repositoryId: string;
};

export type GithubDiscussion = {
  id: string;
  url: string;
  title: string;
};

export class GithubDiscussionError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "GithubDiscussionError";
  }
}

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GithubDiscussionError(
      "GITHUB_TOKEN is not set. Create one at https://github.com/settings/tokens " +
      "(needs repo scope for private repos, public_repo for public).",
      401,
    );
  }
  return token;
}

export function defaultRepositoryId(): string {
  const id = process.env.GITHUB_REPO_ID;
  if (!id) {
    throw new GithubDiscussionError(
      "GITHUB_REPO_ID is not set. Query it via the GitHub GraphQL API: " +
      "repository(owner: \"fworks-tech\", name: \"flabs.tech\") { id }",
      401,
    );
  }
  return id;
}

export function defaultCategoryId(): string {
  const id = process.env.GITHUB_DISCUSSION_CATEGORY_ID;
  if (!id) {
    throw new GithubDiscussionError(
      "GITHUB_DISCUSSION_CATEGORY_ID is not set. Find it by querying: " +
      "repository(owner: \"fworks-tech\", name: \"flabs.tech\") { discussionCategories(first: 10) { nodes { id name } } }",
      401,
    );
  }
  return id;
}

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${GITHUB_API}/graphql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error({ status: response.status, body: text }, "GitHub API request failed");
    throw new GithubDiscussionError(
      `GitHub API returned ${response.status}`,
      response.status,
      text,
    );
  }

  const json: { data?: T; errors?: Array<{ message: string }> } = await response.json();

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e: { message: string }) => e.message).join("; ");
    logger.error({ errors: json.errors }, "GitHub GraphQL errors");
    throw new GithubDiscussionError(
      `GitHub GraphQL error: ${messages}`,
      400,
      json.errors,
    );
  }

  if (!json.data) {
    throw new GithubDiscussionError("GitHub GraphQL returned empty data", 400);
  }

  return json.data;
}

export type AnnounceArticleInput = {
  title: string;
  body: string;
  url: string;
  tags?: string[];
};

export async function createDiscussion(
  input: GithubDiscussionInput,
): Promise<GithubDiscussion> {
  const mutation = `
    mutation CreateDiscussion($input: CreateDiscussionInput!) {
      createDiscussion(input: $input) {
        discussion {
          id
          url
          title
        }
      }
    }
  `;

  const result = await graphqlRequest<{
    createDiscussion: {
      discussion: {
        id: string;
        url: string;
        title: string;
      };
    };
  }>(mutation, {
    input: {
      repositoryId: input.repositoryId,
      categoryId: input.categoryId,
      title: input.title,
      body: input.body,
    },
  });

  logger.info(
    { discussionId: result.createDiscussion.discussion.id, title: result.createDiscussion.discussion.title },
    "Discussion created on GitHub",
  );

  return {
    id: result.createDiscussion.discussion.id,
    url: result.createDiscussion.discussion.url,
    title: result.createDiscussion.discussion.title,
  };
}

export async function announceArticle(
  input: AnnounceArticleInput,
  repoId?: string,
  categoryId?: string,
): Promise<GithubDiscussion> {
  const tags = input.tags?.map((t) => `\`#${t.replace(/[^a-zA-Z0-9-]/g, "")}\``).join(" ") || "";
  const body = `${input.body}\n\n---\n\n[Read the full article →](${input.url})\n\n${tags}`;

  return createDiscussion({
    title: input.title,
    body,
    repositoryId: repoId || defaultRepositoryId(),
    categoryId: categoryId || defaultCategoryId(),
  });
}
