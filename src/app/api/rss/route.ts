import { baseURL } from "@/config";
import { blog, person } from "@/content";
import { logger } from "@/lib/logger";
import { getPosts } from "@/lib/mdx";
import { NextResponse } from "next/server";

/**
 * GET /api/rss
 *
 * Generates an RSS 2.0 feed of all blog posts sorted by publication date
 * (newest first). Returns XML with a 1-hour cache time.
 *
 * Falls back to a minimal feed with only channel metadata if blog posts
 * cannot be loaded (e.g. missing content directory).
 */
export async function GET() {
  let posts;
  try {
    posts = getPosts(["src", "content", "blog"]);
  } catch (error) {
    logger.error(error, "failed to load blog posts for RSS feed");
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${blog.title}</title><description>${blog.description}</description></channel></rss>`,
      {
        headers: { "Content-Type": "application/xml" },
        status: 200,
      },
    );
  }

  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a, b) => {
    return new Date(b.metadata.publishedAt).getTime() - new Date(a.metadata.publishedAt).getTime();
  });

  // Generate RSS XML
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${blog.title}</title>
    <link>${baseURL}/blog</link>
    <description>${blog.description}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseURL}/api/rss" rel="self" type="application/rss+xml" />
    <managingEditor>${person.email || "noreply@example.com"} (${person.name})</managingEditor>
    <webMaster>${person.email || "noreply@example.com"} (${person.name})</webMaster>
    <image>
      <url>${baseURL}${person.avatar || "/images/avatar.jpg"}</url>
      <title>${blog.title}</title>
      <link>${baseURL}/blog</link>
    </image>
    ${sortedPosts
      .map(
        (post) => `
    <item>
      <title>${post.metadata.title}</title>
      <link>${baseURL}/blog/${post.slug}</link>
      <guid>${baseURL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.metadata.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.metadata.summary}]]></description>
      ${post.metadata.image ? `<enclosure url="${baseURL}${post.metadata.image}" type="image/jpeg" />` : ""}
      ${post.metadata.tag ? `<category>${post.metadata.tag}</category>` : ""}
      <author>${person.email || "noreply@example.com"} (${person.name})</author>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  // Return the RSS XML with the appropriate content type
  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
