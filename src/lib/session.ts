import { auth } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side gate for the hidden admin area.
 *
 * Redirects anonymous visitors to the Auth.js sign-in page, which only
 * completes for the owner's GitHub account (see `signIn` callback in `@/auth`).
 *
 * Test backdoor: when `E2E_FAKE_SESSION=1`, the environment is not
 * production, AND the `e2e_fake_session` cookie is present, a fake
 * session is returned so the authenticated admin render can be
 * exercised locally and in CI without GitHub SSO. The cookie gate keeps
 * the rest of the auth-flow e2e suite (which expects `/admin` to
 * redirect) untouched. Never active in production (double-gated).
 */
export async function requireSession() {
  if (process.env.E2E_FAKE_SESSION === "1" && process.env.NODE_ENV !== "production") {
    const cookieStore = await cookies();
    if (cookieStore.get("e2e_fake_session")?.value === "1") {
      return {
        user: {
          id: "e2e-fake-user",
          name: "E2E Fake User",
          email: "e2e@example.com",
          login: "fworks-tech",
        },
      };
    }
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=%2Fadmin");
  }
  return session;
}
