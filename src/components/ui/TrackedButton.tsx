"use client";

import { Button } from "@mantine/core";
import { trackEvent } from "@/lib/analytics";
import Link from "next/link";
import type { ReactNode } from "react";

interface TrackedButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "tertiary" | "filled" | "light" | "subtle" | "outline";
  size?: "s" | "m" | "l" | "sm" | "md" | "lg";
  arrowIcon?: boolean;
  children: ReactNode;
  eventName: string;
  eventLabel?: string;
}

const variantMap: Record<string, "filled" | "light" | "subtle" | "outline"> = {
  primary: "filled",
  secondary: "light",
  tertiary: "subtle",
};

const sizeMap: Record<string, "sm" | "md" | "lg"> = {
  s: "sm",
  m: "md",
  l: "lg",
};

export function TrackedButton({
  href,
  variant = "primary",
  size = "m",
  children,
  eventName,
  eventLabel,
}: TrackedButtonProps) {
  return (
    <Button
      component={Link}
      href={href}
      variant={variantMap[variant] || (variant as "filled" | "light" | "subtle" | "outline")}
      size={sizeMap[size] || (size as "sm" | "md" | "lg")}
      onClick={() => trackEvent(eventName as "cta_click", { label: eventLabel || href })}
    >
      {children}
    </Button>
  );
}
