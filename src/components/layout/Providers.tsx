"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { mantineTheme } from "@/config/mantine-theme";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

type IdentifiedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  login?: string;
};

export function Providers({ children, user }: { children: React.ReactNode; user?: IdentifiedUser }) {
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !user ||
      identifiedUserId.current === user.id ||
      !process.env.NEXT_PUBLIC_POSTHOG_KEY
    ) {
      return;
    }

    if (identifiedUserId.current) {
      posthog.reset();
    }
    posthog.identify(user.id, {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      login: user.login,
    });
    identifiedUserId.current = user.id;
  }, [user]);

  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
      <Notifications position="top-right" autoClose={3000} />
      {children}
    </MantineProvider>
  );
}
