import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { Redis } from "@upstash/redis";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
import { logger } from "@/lib/logger";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  logger.warn(
    "UPSTASH_REDIS_REST_URL/TOKEN not set — Auth.js sessions will fall back to the built-in JWT session cookie.",
  );
}

const redis = new Redis({ url: url ?? "", token: token ?? "" });

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: UpstashRedisAdapter(redis),
  providers: [GitHub],
  // Dev/e2e fallback so `auth()` doesn't throw MissingSecret in `next dev`.
  // Production always requires AUTH_SECRET (fails closed without it).
  secret: process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : "flabs-dev-secret"),
  session: {
    strategy: url && token ? "database" : "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ profile }) {
      const allowed = process.env.ALLOWED_GITHUB_LOGIN;
      if (!allowed) {
        logger.warn("ALLOWED_GITHUB_LOGIN not set — refusing all GitHub sign-ins");
        return false;
      }
      const login = profile?.login ?? profile?.name;
      if (login !== allowed) {
        logger.warn({ login }, "rejected GitHub sign-in: not the site owner");
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        const login = (user as { login?: string }).login;
        if (login) {
          session.user.login = login;
        }
      }
      return session;
    },
  },
});
