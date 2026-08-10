import { Stack, Text, Title } from "@mantine/core";
import { formatDate } from "@/lib/formatDate";
import { isPostVisible } from "@/lib/draft";
import { getPosts } from "@/lib/mdx";
import { DraftsTable, type DraftRow } from "./DraftLinks";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminDraftsPage() {
  const allPosts = getPosts(["src", "content", "blog"]);
  const hidden = allPosts.filter((post) => !isPostVisible(post.metadata));

  const rows: DraftRow[] = hidden.map((post) => ({
    slug: post.slug,
    title: post.metadata.title,
    draft: post.metadata.draft === true,
    scheduled: !isPostVisible(post.metadata) && post.metadata.draft !== true,
    hidden: !isPostVisible(post.metadata),
    publishedAt: post.metadata.publishedAt || undefined,
    scheduledAt: post.metadata.scheduledAt || undefined,
    tag: post.metadata.tag || undefined,
  }));

  return (
    <Stack gap="lg">
      <Title order={2}>Drafts &amp; scheduled posts</Title>
      <Text size="sm" c="dimmed">
        Posts hidden from public view (draft flag or future scheduledAt). {hidden.length} hidden of{" "}
        {allPosts.length} total.
      </Text>

      {rows.length === 0 ? (
        <Text c="dimmed">Nothing hidden right now — every post is published.</Text>
      ) : (
        <DraftsTable rows={rows} />
      )}
    </Stack>
  );
}
