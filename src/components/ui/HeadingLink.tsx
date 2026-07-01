"use client";

import { logger } from "@/lib/logger";
import { Flex, Heading, IconButton, useToast } from "@once-ui-system/core";
import type React from "react";
import type { JSX } from "react";

import styles from "@/components/ui/HeadingLink.module.scss";

interface HeadingLinkProps {
  /** The `id` attribute for the heading element, used for anchor linking */
  id: string;
  /** HTML heading level (1–6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Heading text content */
  children: React.ReactNode;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * Renders a heading with an anchor-link button.
 *
 * Clicking the heading or the link icon copies the page URL with the heading
 * ID hash to the clipboard. The visual style maps heading levels to Once UI
 * typography variants.
 */
export const HeadingLink: React.FC<HeadingLinkProps> = ({ id, level, children, style }) => {
  const { addToast } = useToast();

  const copyURL = (id: string): void => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(
      () => {
        addToast({
          variant: "success",
          message: "Link copied to clipboard.",
        });
      },
      (error) => {
        logger.error(error, "failed to copy heading link");
        addToast({
          variant: "danger",
          message: "Failed to copy link.",
        });
      },
    );
  };

  const variantMap = {
    1: "display-strong-xs",
    2: "heading-strong-xl",
    3: "heading-strong-l",
    4: "heading-strong-m",
    5: "heading-strong-s",
    6: "heading-strong-xs",
  } as const;

  const variant = variantMap[level];
  const asTag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Flex
      style={style}
      onClick={() => copyURL(id)}
      className={styles.control}
      vertical="center"
      gap="4"
    >
      <Heading className={styles.text} id={id} variant={variant} as={asTag}>
        {children}
      </Heading>
      <IconButton
        className={styles.visibility}
        size="s"
        icon="openLink"
        variant="ghost"
        tooltip="Copy"
        tooltipPosition="right"
      />
    </Flex>
  );
};
