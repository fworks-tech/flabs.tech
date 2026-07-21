"use client";

import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import type React from "react";
import { useSyncExternalStore } from "react";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isClient = useIsClient();

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={toggleColorScheme}
      aria-label={`Switch to ${colorScheme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${colorScheme === "dark" ? "light" : "dark"} theme`}
      className={className}
    >
      {isClient && (colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />)}
    </ActionIcon>
  );
};
