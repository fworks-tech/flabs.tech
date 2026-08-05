import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import Link from "next/link";
import { CustomMDX } from "@/components";
import { formatDate } from "@/lib/formatDate";
import { isPostVisible } from "@/lib/draft";
import { getPosts } from "@/lib/mdx";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminDraftPreview({
  params,
}: {
  params: Promise<{ slug: string | string[] }>;
}) {
  const routeParams = await params;
  const slug = Array.isArray(routeParams.slug) ? routeParams.slug.join("/") : routeParams.slug;

  const posts = getPosts(["src", "content", "blog"]);
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  const visible = isPostVisible(post.metadata);
  const scheduledAt = post.metadata.scheduledAt;

  return (
    <Stack gap="md" maw={900} w="100%" mx="auto">
      <Group justify="space-between">
        <Group gap="sm">
          <Button component={Link} href="/admin/drafts" variant="subtle" size="xs">
            ← Back to drafts
          </Button>
          {!visible && <Badge color="yellow">Draft</Badge>}
          {scheduledAt && (
            <Badge color="blue" variant="light">
              Scheduled {formatDate(scheduledAt)}
            </Badge>
          )}
        </Group>
      </Group>

      <Stack align="center" gap="8">
        <Text size="xs" c="dimmed">
          {post.metadata.publishedAt ? formatDate(post.metadata.publishedAt) : "Not published yet"}
          {post.metadata.tag ? ` · ${post.metadata.tag}` : ""}
        </Text>
        <Title order={1} ta="center">
          {post.metadata.title}
        </Title>
        {post.metadata.subtitle && (
          <Text size="md" c="dimmed" ta="center" fs="italic">
            {post.metadata.subtitle}
          </Text>
        )}
      </Stack>

      {post.metadata.summary && (
        <Text size="sm" c="dimmed">
          {post.metadata.summary}
        </Text>
      )}

      <Stack component="article" gap="md">
        <CustomMDX source={post.content} />
      </Stack>
    </Stack>
  );
}
