"use client";

import { ActionIcon, Button, Group, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandReddit,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconDeviceFloppy,
  IconLink,
  IconMail,
  IconShare,
  IconSquareLetterX,
} from "@tabler/icons-react";
import { socialSharing } from "@/config";
import { logger } from "@/lib/logger";

interface ShareSectionProps {
  title: string;
  url: string;
  shareText?: string;
}

interface SocialPlatform {
  name: string;
  icon: string;
  label: string;
  generateUrl: (title: string, url: string, shareText?: string) => string;
}

const socialPlatforms: Record<string, SocialPlatform> = {
  x: {
    name: "x",
    icon: "x",
    label: "X",
    generateUrl: (title, url, shareText) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText || title)}&url=${encodeURIComponent(url)}`,
  },
  linkedin: {
    name: "linkedin",
    icon: "linkedin",
    label: "LinkedIn",
    generateUrl: (_title, url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  facebook: {
    name: "facebook",
    icon: "facebook",
    label: "Facebook",
    generateUrl: (title, url, shareText) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText || title)}`,
  },
  whatsapp: {
    name: "whatsapp",
    icon: "whatsapp",
    label: "WhatsApp",
    generateUrl: (title, url, shareText) =>
      `https://wa.me/?text=${encodeURIComponent(`${shareText || title} ${url}`)}`,
  },
  reddit: {
    name: "reddit",
    icon: "reddit",
    label: "Reddit",
    generateUrl: (title, url, shareText) =>
      `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareText || title)}`,
  },
  telegram: {
    name: "telegram",
    icon: "telegram",
    label: "Telegram",
    generateUrl: (title, url, shareText) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText || title)}`,
  },
  email: {
    name: "email",
    icon: "email",
    label: "Email",
    generateUrl: (title, url, shareText) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText || `Check out this post: ${url}`)}`,
  },
};

const iconMap: Record<string, React.ReactNode> = {
  x: <IconSquareLetterX size={16} />,
  linkedin: <IconBrandLinkedin size={16} />,
  facebook: <IconBrandFacebook size={16} />,
  whatsapp: <IconBrandWhatsapp size={16} />,
  reddit: <IconBrandReddit size={16} />,
  telegram: <IconBrandTelegram size={16} />,
  email: <IconMail size={16} />,
};

export function ShareSection({ title, url, shareText }: ShareSectionProps) {
  if (!socialSharing.display) {
    return null;
  }

  const handleCopy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notifications.show({ message, autoClose: 2000 });
    } catch (err) {
      logger.error(err, "Failed to copy");
      notifications.show({ color: "red", message: "Failed to copy", autoClose: 2000 });
    }
  };

  const enabledPlatforms = Object.entries(socialSharing.platforms as Record<string, boolean>)
    .filter(([_, enabled]) => enabled && _ !== "copyLink")
    .map(([platformKey]) => ({ key: platformKey, ...socialPlatforms[platformKey] }))
    .filter((platform) => platform.name);

  return (
    <Group mt="32" mb="16" gap="16" justify="center">
      <Text size="sm" c="dimmed">
        Share this post:
      </Text>
      <Group gap="16" justify="center" wrap="wrap">
        {enabledPlatforms.map((platform, index) => (
          <Tooltip key={index} label={`Share on ${platform.label}`} withArrow>
            <ActionIcon
              component="a"
              href={platform.generateUrl(title, url, shareText)}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              size="lg"
              aria-label={`Share on ${platform.label}`}
            >
              {iconMap[platform.icon] || <IconShare size={16} />}
            </ActionIcon>
          </Tooltip>
        ))}

        {(socialSharing.platforms as Record<string, boolean>).copyLink && (
          <Tooltip label={shareText ? "Copy share text" : "Copy link"} withArrow>
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() =>
                shareText
                  ? handleCopy(shareText, "Share text copied to clipboard")
                  : handleCopy(url, "Link copied to clipboard")
              }
              aria-label={shareText ? "Copy share text" : "Copy link"}
            >
              <IconLink size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Group>
  );
}
