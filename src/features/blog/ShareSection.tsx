"use client";

import { socialSharing } from "@/config";
import { logger } from "@/lib/logger";
import { Button, Row, Text, useToast } from "@once-ui-system/core";

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
    icon: "twitter",
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
  pinterest: {
    name: "pinterest",
    icon: "pinterest",
    label: "Pinterest",
    generateUrl: (title, url, shareText) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(shareText || title)}`,
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
  devto: {
    name: "devto",
    icon: "devto",
    label: "Dev.to",
    generateUrl: (title, url) =>
      `https://dev.to/new?prefill=${encodeURIComponent(`---\ntitle: ${title}\n---\n\nOriginally posted at: ${url}`)}`,
  },
  hackernews: {
    name: "hackernews",
    icon: "hackernews",
    label: "Hacker News",
    generateUrl: (title, url) =>
      `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`,
  },
};

export function ShareSection({ title, url, shareText }: ShareSectionProps) {
  const { addToast } = useToast();
  // Don't render if sharing is disabled
  if (!socialSharing.display) {
    return null;
  }

  const handleCopy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        variant: "success",
        message,
      });
    } catch (err) {
      logger.error(err, "Failed to copy");
      addToast({
        variant: "danger",
        message: "Failed to copy",
      });
    }
  };

  // Get enabled platforms
  const enabledPlatforms = Object.entries(socialSharing.platforms)
    .filter(([_, enabled]) => enabled && _ !== "copyLink")
    .map(([platformKey]) => ({ key: platformKey, ...socialPlatforms[platformKey] }))
    .filter((platform) => platform.name); // Filter out platforms that don't exist in our definitions

  return (
    <Row fillWidth center gap="16" marginTop="32" marginBottom="16">
      <Text variant="label-default-m" onBackground="neutral-weak">
        Share this post:
      </Text>
      <Row data-border="rounded" gap="16" horizontal="center" wrap>
        {enabledPlatforms.map((platform, index) => {
          return (
            <Button
              key={index}
              variant="secondary"
              size="s"
              href={platform.generateUrl(title, url, shareText)}
              prefixIcon={platform.icon}
              aria-label={`Share on ${platform.label}`}
              title={`Share on ${platform.label}`}
            />
          );
        })}

        {socialSharing.platforms.copyLink && (
          <Button
            variant="secondary"
            size="s"
            onClick={() =>
              shareText
                ? handleCopy(shareText, "Share text copied to clipboard")
                : handleCopy(url, "Link copied to clipboard")
            }
            prefixIcon="openLink"
            aria-label={shareText ? "Copy share text" : "Copy link"}
            title={shareText ? "Copy share text" : "Copy link"}
          />
        )}
      </Row>
    </Row>
  );
}
