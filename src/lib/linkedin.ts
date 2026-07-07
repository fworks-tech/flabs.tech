import { logger } from "@/lib/logger";

const LINKEDIN_API = "https://api.linkedin.com/v2";

export type LinkedinShareInput = {
  text: string;
  articleUrl: string;
  articleTitle: string;
  articleDescription?: string;
  articleThumbnail?: string;
};

export type LinkedinShare = {
  id: string;
  activityId?: string;
};

export class LinkedinError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "LinkedinError";
  }
}

function getToken(): string {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) {
    throw new LinkedinError(
      "LINKEDIN_ACCESS_TOKEN is not set. " +
      "Get it by creating a LinkedIn Developer App at https://www.linkedin.com/developers/apps " +
      "and requesting the w_member_social scope.",
      401,
    );
  }
  return token;
}

function getPersonId(): string {
  const id = process.env.LINKEDIN_PERSON_ID;
  if (id) return id;
  throw new LinkedinError(
    "LINKEDIN_PERSON_ID is not set. Query it by calling GET /me " +
    "with your access token: https://api.linkedin.com/v2/me",
    401,
  );
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${LINKEDIN_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202501",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error({ status: response.status, body: text }, "LinkedIn API request failed");
    throw new LinkedinError(
      `LinkedIn API returned ${response.status}`,
      response.status,
      text,
    );
  }

  return response.json() as Promise<T>;
}

export async function shareArticle(input: LinkedinShareInput): Promise<LinkedinShare> {
  const personId = getPersonId();

  const result = await request<{ id: string; activity?: string }>(
    "POST",
    "/ugcPosts",
    {
      author: `urn:li:person:${personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: input.text.slice(0, 3000),
          },
          shareMediaCategory: "ARTICLE",
          media: [
            {
              status: "READY",
              description: {
                text: (input.articleDescription || input.articleTitle).slice(0, 256),
              },
              originalUrl: input.articleUrl,
              title: {
                text: input.articleTitle.slice(0, 200),
              },
              ...(input.articleThumbnail ? { thumbnail: input.articleThumbnail } : {}),
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    },
  );

  logger.info({ shareId: result.id }, "Article shared on LinkedIn");

  return {
    id: result.id,
    activityId: result.activity,
  };
}
