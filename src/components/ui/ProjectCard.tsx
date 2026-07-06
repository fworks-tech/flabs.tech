"use client";

import {
  AvatarGroup,
  Carousel,
  Column,
  Flex,
  SmartLink,
  Text,
} from "@once-ui-system/core";
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
    <Column fillWidth gap="m">
      {images.length > 0 && (
        <Carousel
          sizes="(max-width: 960px) 100vw, 960px"
          items={images.map((image) => ({
            slide: image,
            alt: `Screenshot of ${title} - project showcase image`,
          }))}
        />
      )}
      <Flex fillWidth flex='1' direction='row' paddingX="s" style={{ alignItems: "center", justifyContent: "space-between" }} >
        {
          <div className={styles.visualHeader} data-tag={tagKey}>
            <span className={styles.visualTitle}>{title}</span>
          </div>
        }
        {allTags.length > 0 && (
          <Flex paddingX="xs" gap="8" wrap>
            {allTags.map((t) => (
              <span key={t} className={styles.visualTag}>
                {t}
              </span>
            ))}
          </Flex>
        )}
      </Flex>
      <Flex
        s={{ direction: "column" }}
        fillWidth
        paddingX="s"
        paddingTop="12"
        paddingBottom="24"
        gap="l"
      >
        {(avatars?.length > 0 || description?.trim() || content?.trim()) && (
          <Column gap="16">
            {avatars?.length > 0 && <AvatarGroup avatars={avatars} size="m" reverse />}
            {description?.trim() && (
              <Text variant="body-default-s" onBackground="neutral-weak">
                {description}
              </Text>
            )}
            <Flex gap="24" wrap>
              {content?.trim() && (
                <SmartLink
                  suffixIcon="arrowRight"
                  style={{ margin: "0", width: "fit-content" }}
                  href={href}
                >
                  <Text variant="body-default-s">Read case study</Text>
                </SmartLink>
              )}
              {link && (
                <SmartLink
                  suffixIcon="arrowUpRightFromSquare"
                  style={{ margin: "0", width: "fit-content" }}
                  href={link}
                >
                  <Text variant="body-default-s">View project</Text>
                </SmartLink>
              )}
            </Flex>
          </Column>
        )}
      </Flex>
    </Column>
  );
};
