"use client";

import { Anchor, Avatar, Group, Stack, Text } from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import Link from "next/link";
import styles from "./ProjectCard.module.scss";

interface ProjectCardProps {
  href: string;
  priority?: boolean;
  images: string[];
  title: string;
  content: string;
  description: string;
  avatars: { src: string; "aria-label"?: string }[];
  link: string;
  tag?: string;
  tags?: string[];
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  href,
  images = [],
  title,
  content,
  description,
  avatars,
  link,
  tag,
  tags,
}) => {
  const allTags = tags?.length ? tags : tag ? [tag] : [];
  const tagKey = (tag || (tags?.[0] ?? "")).toLowerCase().replace(/[^a-z]/g, "-");

  return (
    <Stack gap="md">
      {images.length > 0 && (
        <Carousel withIndicators height={300}>
          {images.map((image, i) => (
            <Carousel.Slide key={i}>
              <img
                src={image}
                alt={`Screenshot of ${title} - project showcase image`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Carousel.Slide>
          ))}
        </Carousel>
      )}
      <Group px="sm" align="center" justify="space-between" style={{ width: "100%" }}>
        <div className={styles.visualHeader} data-tag={tagKey}>
          <span className={styles.visualTitle}>{title}</span>
        </div>
        {allTags.length > 0 && (
          <Group gap="8" wrap="wrap">
            {allTags.map((t) => (
              <span key={t} className={styles.visualTag}>
                {t}
              </span>
            ))}
          </Group>
        )}
      </Group>
      <Stack px="sm" pt="12" pb="24" gap="lg">
        {(avatars?.length > 0 || description?.trim() || content?.trim()) && (
          <Stack gap="16">
            {avatars?.length > 0 && (
              <Avatar.Group spacing="sm">
                {avatars.map((avatar, i) => (
                  <Avatar key={i} src={avatar.src} size="sm" alt={avatar["aria-label"] || ""} />
                ))}
              </Avatar.Group>
            )}
            {description?.trim() && (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            )}
            <Group gap="24" wrap="wrap">
              {content?.trim() && (
                <Anchor component={Link} href={href} size="sm">
                  Read case study
                </Anchor>
              )}
              {link && (
                <Anchor href={link} target="_blank" rel="noopener noreferrer" size="sm">
                  View project
                </Anchor>
              )}
            </Group>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
