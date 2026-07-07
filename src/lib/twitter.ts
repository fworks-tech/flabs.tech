import crypto from "node:crypto";
import { logger } from "@/lib/logger";

const TWITTER_API = "https://api.twitter.com/2";

export type TwitterTweetInput = {
  text: string;
};

export type TwitterTweet = {
  id: string;
  text: string;
};

export class TwitterError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "TwitterError";
  }
}

function getCredentials() {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    const missing = [];
    if (!apiKey) missing.push("TWITTER_API_KEY");
    if (!apiSecret) missing.push("TWITTER_API_SECRET");
    if (!accessToken) missing.push("TWITTER_ACCESS_TOKEN");
    if (!accessSecret) missing.push("TWITTER_ACCESS_SECRET");
    throw new TwitterError(
      `Missing Twitter credentials: ${missing.join(", ")}. ` +
      "Get them at https://developer.twitter.com/en/portal/dashboard",
      401,
    );
  }

  return { apiKey, apiSecret, accessToken, accessSecret };
}

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function generateOAuthParams(): Record<string, string> {
  return {
    oauth_consumer_key: getCredentials().apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: getCredentials().accessToken,
    oauth_version: "1.0",
  };
}

function generateSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  bodyHash?: string,
): string {
  const { apiSecret, accessSecret } = getCredentials();

  const allParams = { ...params };
  if (bodyHash) {
    allParams.oauth_body_hash = bodyHash;
  }

  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((key) => `${percentEncode(key)}=${percentEncode(allParams[key])}`)
    .join("&");

  const signatureBaseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(signatureBaseString)
    .digest("base64");
}

function buildAuthHeader(
  oauthParams: Record<string, string>,
  signature: string,
): string {
  const all: Record<string, string> = { ...oauthParams, oauth_signature: signature };
  const parts = Object.keys(all)
    .sort()
    .map((key) => `${percentEncode(key)}="${percentEncode(all[key])}"`);
  return `OAuth ${parts.join(", ")}`;
}

function isIndexEntry(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("index") ||
    lower.startsWith("about") ||
    lower.startsWith("overview")
  );
}

export async function createTweet(input: TwitterTweetInput): Promise<TwitterTweet> {
  if (!input.text || input.text.length === 0) {
    throw new TwitterError("Tweet text cannot be empty", 422);
  }

  if (input.text.length > 280) {
    throw new TwitterError("Tweet text exceeds 280 character limit", 422);
  }

  const body = JSON.stringify({ text: input.text });
  const oauthParams = generateOAuthParams();
  const signature = generateSignature("POST", `${TWITTER_API}/tweets`, {
    ...oauthParams,
    text: input.text,
  });
  const authHeader = buildAuthHeader(oauthParams, signature);

  const response = await fetch(`${TWITTER_API}/tweets`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    logger.error({ status: response.status, body: text }, "Twitter API request failed");
    throw new TwitterError(
      `Twitter API returned ${response.status}`,
      response.status,
      text,
    );
  }

  const result: { data: { id: string; text: string } } = await response.json();
  logger.info({ tweetId: result.data.id }, "Tweet posted successfully");

  return {
    id: result.data.id,
    text: result.data.text,
  };
}

export async function shareArticle(params: {
  title: string;
  url: string;
  summary?: string;
  tags?: string[];
}): Promise<TwitterTweet> {
  const tags = params.tags?.slice(0, 3).map((t) => `#${t.replace(/[^a-zA-Z0-9]/g, "")}`).join(" ") || "";
  const summary = params.summary ? `${params.summary.slice(0, 100)} — ` : "";
  const text = `${summary}${params.title} ${params.url}${tags ? ` ${tags}` : ""}`;

  const tweetText = text.length > 280 ? `${text.slice(0, 277)}...` : text;

  return createTweet({ text: tweetText });
}
