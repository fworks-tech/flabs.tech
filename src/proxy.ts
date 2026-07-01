import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Next.js proxy that logs all incoming requests.
 *
 * Every request matching the configured path matcher is logged with
 * its HTTP method and URL path. A `Server-Timing` header is added
 * to the response for basic performance observability.
 */
export function proxy(request: NextRequest) {
  const { method, nextUrl } = request;
  const start = Date.now();

  logger.info({ method, path: nextUrl.pathname }, "incoming request");

  const response = NextResponse.next();

  response.headers.set("Server-Timing", `request;dur=${Date.now() - start}`);

  return response;
}

/**
 * Proxy matcher — skips static assets and image files to avoid
 * unnecessary log noise and edge function invocations.
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
