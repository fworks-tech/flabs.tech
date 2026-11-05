import { auth } from '@/auth';

/**
 * Returns true when the visitor holds a valid Auth.js GitHub SSO session
 * (persisted in Redis when configured).
 *
 * Used to gate admin-only API routes such as draft preview and cross-posting.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await auth();
    return Boolean(session?.user);
  } catch {
    return false;
  }
}
