"use client";

import { ActionIcon, Group, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLink } from "@tabler/icons-react";
import { logger } from "@/lib/logger";
import type React from "react";

import styles from "@/components/ui/HeadingLink.module.scss";

interface HeadingLinkProps {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const HeadingLink: React.FC<HeadingLinkProps> = ({ id, level, children, style }) => {
  const copyURL = (id: string): void => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(
      () => {
        notifications.show({
          message: "Link copied to clipboard.",
          autoClose: 2000,
        });
      },
      (error) => {
        logger.error(error, "failed to copy heading link");
        notifications.show({
          color: "red",
          message: "Failed to copy link.",
          autoClose: 2000,
        });
      },
    );
  };

  return (
    <Group
      style={style}
      onClick={() => copyURL(id)}
      className={styles.control}
      align="center"
      gap="4"
    >
      <Title id={id} order={level} className={styles.text}>
        {children}
      </Title>
      <ActionIcon
        className={styles.visibility}
        size="sm"
        variant="subtle"
        aria-label="Copy"
      >
        <IconLink size={14} />
      </ActionIcon>
    </Group>
  );
};
