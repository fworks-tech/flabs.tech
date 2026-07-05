/**
 * Client-side button wrapper that fires an analytics event on click.
 *
 * Use this in server components where you can't use onClick directly.
 * Renders as an Once UI Button with the same visual appearance.
 *
 * @example
 * ```tsx
 * import { TrackedButton } from "@/components/ui/TrackedButton";
 *
 * <TrackedButton href="/projects" eventName="cta_click" eventLabel="View Projects">
 *   View Projects
 * </TrackedButton>
 * ```
 */

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
