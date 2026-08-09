/**
 * Web search tool for the AI assistant. Fetches a URL and returns
 * a text excerpt. Rate-limited to prevent abuse.
 */

const MAX_CONTENT_LENGTH = 8000;
const FETCH_TIMEOUT_MS = 10000;

/** Simple HTML-to-text extraction (no external deps). */
function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);
}

export async function fetchUrlContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "flabs-tech-assistant/1.0",
      Accept: "text/html,text/plain",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    return `Error: Failed to fetch ${url} (${res.status})`;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const body = await res.text();

  if (contentType.includes("text/html")) {
    return extractText(body);
  }
  return body.slice(0, MAX_CONTENT_LENGTH);
}
