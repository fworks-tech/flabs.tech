"use client";

import { Row, ToggleButton, useTheme } from "@once-ui-system/core";
import type React from "react";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") || "light";
}

function getServerSnapshot() {
  return "light";
}

export const ThemeToggle: React.FC = () => {
  const { setTheme } = useTheme();
  const currentTheme = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  const icon = currentTheme === "dark" ? "light" : "dark";
  const nextTheme = currentTheme === "light" ? "dark" : "light";

  return (
    <ToggleButton
      prefixIcon={icon}
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    />
  );
};
