import { baseURL } from "@/config";
import { blog, person } from "@/content";
import { filterPosts } from "@/lib/draft";
import { logger } from "@/lib/logger";
import { getPosts } from "@/lib/mdx";
import { NextResponse } from "next/server";

function escapeXml(unsafe: string): string {
  if (typeof unsafe !== "string") return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GET /api/rss
 *
 * Generates an RSS 2.0 feed of all blog posts sorted by publication date
 * (newest first). All user-generated content is escaped to prevent XSS.
 */
export async function GET() {
  let posts;
  try {
    posts = filterPosts(getPosts(["src", "content", "blog"]), false);
  } catch (error) {
    logger.error(error, "failed to load blog posts for RSS feed");
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(blog.title)}</title><description>${escapeXml(blog.description)}</description></channel></rss>`,
      {
        headers: { "Content-Type": "application/xml" },
        status: 200,
      },
    );
  }

  const sortedPosts = posts.sort((a, b) => {
    return new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime();
  });

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(blog.title)}</title>
    <link>${baseURL}/blog</link>
    <description>${escapeXml(blog.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseURL}/api/rss" rel="self" type="application/rss+xml" />
    <managingEditor>${escapeXml(person.email || "noreply@example.com")} (${escapeXml(person.name)})</managingEditor>
    <webMaster>${escapeXml(person.email || "noreply@example.com")} (${escapeXml(person.name)})</webMaster>
    <image>
      <url>${baseURL}${person.avatar || "/images/avatar.jpg"}</url>
      <title>${escapeXml(blog.title)}</title>
      <link>${baseURL}/blog</link>
    </image>
    ${sortedPosts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.metadata.title}]]></title>
      <link>${baseURL}/blog/${post.slug}</link>
      <guid>${baseURL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.metadata.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.metadata.summary}]]></description>
      ${post.metadata.image ? `<enclosure url="${baseURL}${post.metadata.image}" type="image/jpeg" />` : ""}
      ${post.metadata.tag ? `<category>${escapeXml(post.metadata.tag)}</category>` : ""}
      <author>${escapeXml(person.email || "noreply@example.com")} (${escapeXml(person.name)})</author>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
