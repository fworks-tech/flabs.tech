"use client";

import { Anchor, Badge, Button, Group, Stack, Table, Text } from "@mantine/core";
import Link from "next/link";

import { PublishToDevtoButton } from "@/components/ui/PublishToDevtoButton";
import { formatDate } from "@/lib/formatDate";

/**
 * Client-side draft components. `Anchor`/`Button` cannot receive
 * `component={Link}` from a Server Component (React forbids passing a
 * component function across the RSC boundary), and `Table.Thead/Tr/Th`
 * etc. are static properties on the `"use client"` `Table` module that
 * resolve to `undefined` when accessed from a Server Component
 * (React error #130). Everything compound lives here, receiving
 * serializable data from the server page.
 */

export function DraftPreviewLink({ href }: { href: string }) {
  return (
    <Anchor component={Link} href={href} size="sm">
      Preview →
    </Anchor>
  );
}

export function BackToDraftsLink({ href }: { href: string }) {
  return (
    <Button component={Link} href={href} variant="subtle" size="xs">
      ← Back to drafts
    </Button>
  );
}

export interface DraftRow {
  slug: string;
  title: string;
  draft: boolean;
  scheduled: boolean;
  hidden: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  tag?: string;
}

export function DraftsTable({ rows }: { rows: DraftRow[] }) {
  return (
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
        {rows.map((post) => (
          <Table.Tr key={post.slug}>
            <Table.Td>
              <Text fw={600}>{post.title}</Text>
              <Text size="xs" c="dimmed">
                {post.slug}
              </Text>
            </Table.Td>
            <Table.Td>
              <Group gap="6">
                {post.draft && <Badge color="yellow">Draft</Badge>}
                {post.scheduled && <Badge color="blue">Scheduled</Badge>}
                {!post.draft && !post.scheduled && <Badge color="gray">Hidden</Badge>}
              </Group>
            </Table.Td>
            <Table.Td>
              <Text size="sm">
                {post.publishedAt ? formatDate(post.publishedAt) : "—"}
              </Text>
              {post.scheduledAt && (
                <Text size="xs" c="dimmed">
                  {formatDate(post.scheduledAt)}
                </Text>
              )}
            </Table.Td>
            <Table.Td>
              {post.tag && <Badge variant="light">{post.tag}</Badge>}
            </Table.Td>
            <Table.Td>
              <Group gap="6" wrap="wrap">
                <PublishToDevtoButton slug={post.slug} size="xs" />
                <DraftPreviewLink href={`/admin/drafts/${post.slug}`} />
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
