"use client";

import { ActionIcon, Button, Group, Text, Tooltip } from "@mantine/core";
import { IconBrandGithub, IconBrandLinkedin, IconMail } from "@tabler/icons-react";
import { person, social } from "@/content";
import { clearConsent } from "@/lib/tracking";
import styles from "./Footer.module.scss";

const iconMap: Record<string, React.ReactNode> = {
  github: <IconBrandGithub size={18} />,
  linkedin: <IconBrandLinkedin size={18} />,
  email: <IconMail size={18} />,
};

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Group component="footer" p="8" justify="center" className={styles.mobile} role="contentinfo" >
      <Group
        maw={1024}
        py="8"
        px="16"
        mb="96"
        gap="16"
        justify="space-between"
        align="center"
        style={{ width: "100%" }}
      >
        <Text size="sm" c="var(--mantine-color-text)">
          © {currentYear} {person.name}
        </Text>
        <Group gap="xs" align="center">
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={clearConsent}
            data-testid="privacy-settings"
          >
            Privacy & analytics
          </Button>
          {social.map(
            (item) =>
              item.link && (
                <Tooltip key={item.name} label={item.name} withArrow>
                  <ActionIcon
                    component="a"
                    href={item.link}
                    variant="subtle"
                    size="lg"
                    aria-label={`Visit my ${item.name} profile`}
                    className={styles.socialIcon}
                    data-track-event="social_link"
                    data-track-label={item.name}
                  >
                    {iconMap[item.icon] || "?"}
                  </ActionIcon>
                </Tooltip>
              ),
          )}
        </Group>
      </Group>
    </Group>
  );
};
