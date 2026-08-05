import { Anchor, Badge, Group, Stack, Table, Text, Title } from "@mantine/core";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";
import { isPostVisible } from "@/lib/draft";
import { getPosts } from "@/lib/mdx";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminDraftsPage() {
  const allPosts = getPosts(["src", "content", "blog"]);
  const hidden = allPosts.filter((post) => !isPostVisible(post.metadata));

  return (
    <Stack gap="lg">
      <Title order={2}>Drafts &amp; scheduled posts</Title>
      <Text size="sm" c="dimmed">
        Posts hidden from public view (draft flag or future scheduledAt). {hidden.length} hidden of{" "}
        {allPosts.length} total.
      </Text>

      {hidden.length === 0 ? (
        <Text c="dimmed">Nothing hidden right now — every post is published.</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Title</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Published / scheduled</Table.Th>
              <Table.Th>Tag</Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {hidden.map((post) => {
              const isDraft = post.metadata.draft === true;
              const isHidden = !isPostVisible(post.metadata);
              const isScheduled = isHidden && !isDraft;

              return (
                <Table.Tr key={post.slug}>
                  <Table.Td>
                    <Text fw={600}>{post.metadata.title}</Text>
                    <Text size="xs" c="dimmed">
                      {post.slug}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="6">
                      {isDraft && <Badge color="yellow">Draft</Badge>}
                      {isScheduled && <Badge color="blue">Scheduled</Badge>}
                      {!isDraft && !isScheduled && <Badge color="gray">Hidden</Badge>}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {post.metadata.publishedAt ? formatDate(post.metadata.publishedAt) : "—"}
                    </Text>
                    {post.metadata.scheduledAt && (
                      <Text size="xs" c="dimmed">
                        {formatDate(post.metadata.scheduledAt)}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {post.metadata.tag && <Badge variant="light">{post.metadata.tag}</Badge>}
                  </Table.Td>
                  <Table.Td>
                    <Anchor component={Link} href={`/admin/drafts/${post.slug}`} size="sm">
                      Preview →
                    </Anchor>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
