"use client";

import { Button } from "@once-ui-system/core";
import { track } from "@vercel/analytics";
import type { ReactNode } from "react";

interface TrackedButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "s" | "m" | "l";
  arrowIcon?: boolean;
  children: ReactNode;
  eventName: string;
  eventLabel?: string;
}

export function TrackedButton({
  href,
  variant = "primary",
  size = "m",
  arrowIcon,
  children,
  eventName,
  eventLabel,
}: TrackedButtonProps) {
  return (
    <Button
      href={href}
      variant={variant}
      size={size}
      arrowIcon={arrowIcon}
      onClick={() => track(eventName, { label: eventLabel || href })}
    >
      {children}
    </Button>
  );
}
