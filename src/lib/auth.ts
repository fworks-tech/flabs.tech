import { cookies } from "next/headers";
import { auth } from "@/auth";
import { validateToken } from "./tokenStore";

/**
 * Returns true when the visitor holds a valid session from either auth path:
 * - Auth.js GitHub SSO session (persisted in Redis)
 * - Legacy password token (`/api/authenticate`, in-memory token store)
 *
 * Used to gate draft/scheduled content on public pages.
 */
export async function isAuthenticated(): Promise<boolean> {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (session?.user) return true;

  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    return false;
  }
  const token = cookieStore.get("authToken")?.value;
  if (!token) return false;
  return validateToken(token);
}
