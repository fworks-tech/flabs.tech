import { cookies } from "next/headers";
import { validateToken } from "./tokenStore";

export async function isAuthenticated(): Promise<boolean> {
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
