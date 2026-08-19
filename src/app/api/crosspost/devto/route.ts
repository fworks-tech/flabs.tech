import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { publishToDevto } from "@/lib/crosspost";
import { DevtoError } from "@/lib/devto";
import { logger } from "@/lib/logger";
import { getPosts } from "@/lib/mdx";

/**
 * POST /api/crosspost/devto
 *
 * Publishes (or updates) a blog post on Dev.to. Auth-guarded; requires a
 * `DEVTO_API_KEY` to be set in the environment. Returns `{ url, devtoId }`
 * on success.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let slug: string;
  try {
    const body = (await request.json()) as { slug?: unknown };
    slug = typeof body.slug === "string" ? body.slug : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const post = getPosts(["src", "content", "blog"]).find((p) => p.slug === slug);
  if (!post) {
    return NextResponse.json({ error: "Post not found", slug }, { status: 404 });
  }

  try {
    const record = await publishToDevto(post);
    return NextResponse.json({ ok: true, url: record.url, devtoId: record.id });
  } catch (error) {
    logger.error({ error, slug }, "failed to cross-post to Dev.to");
    if (error instanceof DevtoError) {
      const status = error.status >= 400 && error.status < 600 ? error.status : 422;
      return NextResponse.json({ error: error.message, slug }, { status });
    }
    return NextResponse.json({ error: "Failed to publish to Dev.to" }, { status: 500 });
  }
}
