"use client";

import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";
import type React from "react";

export const ThemeToggle: React.FC = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      variant="default"
      size="lg"
      onClick={toggleColorScheme}
      aria-label={`Switch to ${colorScheme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${colorScheme === "dark" ? "light" : "dark"} theme`}
    >
      {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
};
