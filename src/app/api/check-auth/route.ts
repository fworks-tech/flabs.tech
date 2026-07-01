import { logger } from "@/lib/logger";
import * as cookie from "cookie";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/check-auth
 *
 * Checks whether the incoming request carries a valid `authToken` cookie
 * (set by the authenticate endpoint). Returns `{ authenticated: true }`
 * if the token exists, `{ authenticated: false }` otherwise.
 */
export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";

  let cookies: Record<string, string | undefined>;
  try {
    cookies = cookie.parse(cookieHeader);
  } catch (error) {
    logger.error(error, "failed to parse cookie header");
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  if (cookies.authToken) {
    return NextResponse.json({ authenticated: true }, { status: 200 });
  }
  return NextResponse.json({ authenticated: false }, { status: 200 });
}
