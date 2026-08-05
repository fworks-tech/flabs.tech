import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Server-side gate for the hidden admin area.
 *
 * Redirects anonymous visitors to the Auth.js sign-in page, which only
 * completes for the owner's GitHub account (see `signIn` callback in `@/auth`).
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=%2Fadmin");
  }
  return session;
}
