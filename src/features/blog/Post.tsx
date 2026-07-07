"use client";

import { Avatar, Badge, Card, Group, Image, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { person } from "@/content";
import { formatDate } from "@/lib/formatDate";
import styles from "./Post.module.scss";

interface PostProps {
  post: {
    slug: string;
    metadata: {
      title: string;
      summary: string;
      publishedAt: string;
      image?: string;
      tags?: string[];
      tag?: string;
    };
  };
  thumbnail: boolean;
  direction?: "row" | "column";
}

export default function Post({ post, thumbnail, direction }: PostProps) {
  return (
    <Card
      component={Link}
      href={`/blog/${post.slug}`}
      className={styles.post}
      padding="lg"
      radius="lg"
      style={{ flexDirection: direction === "column" ? "column" : "row" }}
    >
      {post.metadata.image && thumbnail && (
        <Card.Section>
          <Image
            src={post.metadata.image}
            alt={`Thumbnail of ${post.metadata.title}`}
            radius="lg"
            style={{ aspectRatio: "16 / 9", objectFit: "cover" }}
          />
        </Card.Section>
      )}
      <Stack py="24" gap="20" style={{ flex: 1 }}>
        <Group gap="24" align="center">
          <Group gap="16" align="center">
            <Avatar src={person.avatar} size="sm" alt={`Photo of ${person.name}`} />
            <Text size="sm">{person.name}</Text>
          </Group>
          <Text size="xs" c="dimmed">
            {formatDate(post.metadata.publishedAt, false)}
          </Text>
        </Group>
        <Title order={3}>{post.metadata.title}</Title>
        {post.metadata.summary && (
          <Text size="md" c="dimmed">
            {post.metadata.summary}
          </Text>
        )}
        <Group gap="xs" wrap="wrap">
          {post.metadata.tags?.length
            ? post.metadata.tags.map((t: string) => (
                <Badge key={t} size="sm">
                  {t}
                </Badge>
              ))
            : post.metadata.tag && (
                <Badge size="sm">
                  {post.metadata.tag}
                </Badge>
              )}
        </Group>
      </Stack>
    </Card>
  );
}
