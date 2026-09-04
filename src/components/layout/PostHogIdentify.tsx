"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

type SessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  login?: string;
};

type SessionResponse = {
  user?: SessionUser | null;
};

/**
 * Identifies the logged-in owner to PostHog after mount.
 *
 * Runs client-side so the root layout stays static. Anonymous visitors have
 * no session and are simply never identified.
 */
export const PostHogIdentify = () => {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }
    let cancelled = false;
    const identify = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          return;
        }
        const session = (await res.json()) as SessionResponse;
        if (!cancelled && session?.user?.id) {
          posthog.identify(session.user.id, {
            email: session.user.email ?? undefined,
            name: session.user.name ?? undefined,
            login: session.user.login,
          });
        }
      } catch {
        // No session (or network failure) — visitor stays anonymous.
      }
    };
    void identify();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
};
