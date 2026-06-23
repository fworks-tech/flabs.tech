"use client";

import { person } from "@/content";
import { formatDate } from "@/lib/formatDate";
import { Avatar, Card, Column, Media, Row, Tag, Text } from "@once-ui-system/core";

import styles from "./Post.module.scss";

interface PostProps {
  post: any;
  thumbnail: boolean;
  direction?: "row" | "column";
}

export default function Post({ post, thumbnail, direction }: PostProps) {
  return (
    <Card
      fillWidth
      key={post.slug}
      className={styles.post}
      href={`/blog/${post.slug}`}
      transition="micro-medium"
      direction={direction}
      border="transparent"
      background="transparent"
      padding="24"
      radius="l-4"
      gap={direction === "column" ? undefined : "24"}
      s={{ direction: "column" }}
    >
      {post.metadata.image && thumbnail && (
        <Media
          priority
          sizes="(max-width: 768px) 100vw, 640px"
          border="neutral-alpha-weak"
          cursor="interactive"
          radius="l"
          src={post.metadata.image}
          alt={`Thumbnail of ${post.metadata.title}`}
          aspectRatio="16 / 9"
        />
      )}
      <Row fillWidth>
        <Column paddingY="24" gap="20" vertical="center">
          <Row gap="24" vertical="center">
            <Row vertical="center" gap="16">
              <Avatar src={person.avatar} size="s" aria-label={`Photo of ${person.name}`} />
              <Text variant="label-default-s">{person.name}</Text>
            </Row>
            <Text variant="body-default-xs" onBackground="neutral-weak">
              {formatDate(post.metadata.publishedAt, false)}
            </Text>
          </Row>
          <Text variant="heading-strong-l" wrap="balance">
            {post.metadata.title}
          </Text>
          {post.metadata.summary && (
            <Text variant="body-default-m" onBackground="neutral-weak" wrap="balance">
              {post.metadata.summary}
            </Text>
          )}
          <Row gap="8" wrap>
            {post.metadata.tags?.length
              ? post.metadata.tags.map((t: string) => (
                  <Tag key={t} size="m">
                    {t}
                  </Tag>
                ))
              : post.metadata.tag && (
                  <Tag size="m">
                    {post.metadata.tag}
                  </Tag>
                )}
          </Row>
        </Column>
      </Row>
    </Card>
  );
}
