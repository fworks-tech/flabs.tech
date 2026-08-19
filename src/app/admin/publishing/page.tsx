import { Stack, Text, Title } from '@mantine/core';
import { isPostVisible } from '@/lib/draft';
import { getPosts } from '@/lib/mdx';
import { listDevtoRecords } from '@/lib/devtoStore';
import { LastUpdated } from '../LastUpdated';
import { PublishingTable, type PublishingRow } from './PublishingTable';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPublishingPage() {
  const posts = getPosts(['src', 'content', 'blog']);
  const records = await listDevtoRecords();
  const bySlug = new Map(records.map((record) => [record.slug, record]));

  const rows: PublishingRow[] = posts
    .map((post) => {
      const record = bySlug.get(post.slug);
      return {
        slug: post.slug,
        title: post.metadata.title,
        visible: isPostVisible(post.metadata),
        devtoId: post.metadata.devtoId ?? record?.id,
        devtoUrl: post.metadata.devtoUrl || record?.url,
      };
    })
    .sort(
      (a, b) =>
        Number(b.visible) - Number(a.visible) || a.title.localeCompare(b.title),
    );

  return (
    <Stack gap="lg">
      <Title order={2}>Dev.to publishing</Title>
      <Text size="sm" c="dimmed">
        Cross-post blog posts to Dev.to ({posts.length} posts). The button publishes or
        updates the article and records the result; the GitHub Action commits the{' '}
        <Text component="code" inherit>
          devtoId
        </Text>{' '}
        back to frontmatter.
      </Text>
      <LastUpdated />

      {rows.length === 0 ? (
        <Text c="dimmed">No posts found.</Text>
      ) : (
        <PublishingTable rows={rows} />
      )}
    </Stack>
  );
}
