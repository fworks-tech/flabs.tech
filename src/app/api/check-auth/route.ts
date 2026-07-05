import { logger } from "@/lib/logger";
import { validateToken } from "@/lib/tokenStore";
import * as cookie from "cookie";
import { type NextRequest, NextResponse } from "next/server";

/**
 * GET /api/check-auth
 *
 * Validates the `authToken` cookie against the server-side token store.
 * Returns `{ authenticated: true }` only if the token was issued by
 * the authenticate endpoint and has not expired.
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

  const isValid = validateToken(cookies.authToken);
  return NextResponse.json({ authenticated: isValid }, { status: 200 });
}
