import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rateLimiter";
import { storeToken } from "@/lib/tokenStore";
import * as cookie from "cookie";
import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/authenticate
 *
 * Validates a password submitted via the password-protected route form.
 * On success, stores the token server-side and sets an HTTP-only cookie.
 * Rate-limited per IP address (5 attempts per 60-second window).
 */
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { allowed, retryAfter } = rateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { message: `Too many attempts. Try again in ${retryAfter} seconds.` },
      { status: 429 },
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch (error) {
    logger.error(error, "failed to parse request body");
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }
  const { password } = body;
  const correctPassword = process.env.PAGE_ACCESS_PASSWORD;

  if (!correctPassword) {
    logger.error("PAGE_ACCESS_PASSWORD environment variable is not set");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }

  if (password === correctPassword) {
    const authToken = crypto.randomUUID();
    storeToken(authToken);

    const response = NextResponse.json({ success: true }, { status: 200 });

    response.headers.set(
      "Set-Cookie",
      cookie.serialize("authToken", authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60,
        sameSite: "strict",
        path: "/",
      }),
    );

    return response;
  }
  return NextResponse.json({ message: "Incorrect password" }, { status: 401 });
}
