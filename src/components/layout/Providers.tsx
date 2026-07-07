"use client";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { mantineTheme } from "@/config/mantine-theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
      <Notifications position="top-right" autoClose={3000} />
      {children}
    </MantineProvider>
  );
}
