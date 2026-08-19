'use client';

import { Anchor, Badge, Group, Table, Text } from '@mantine/core';
import { PublishToDevtoButton } from '@/components/ui/PublishToDevtoButton';

/**
 * Client-side publishing table. `Table.Thead/Tr/Th` etc. are static props on
 * the `"use client"` `Table` module that become `undefined` when accessed from
 * a Server Component, so the compound table lives here (see also drafts/).
 */

export interface PublishingRow {
  slug: string;
  title: string;
  visible: boolean;
  devtoId?: number;
  devtoUrl?: string;
}

export function PublishingTable({ rows }: { rows: PublishingRow[] }) {
  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Title</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Dev.to</Table.Th>
          <Table.Th></Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.slug}>
            <Table.Td>
              <Text fw={600}>{row.title}</Text>
              <Text size="xs" c="dimmed">
                {row.slug}
              </Text>
            </Table.Td>
            <Table.Td>
              {row.visible ? (
                <Badge color="green">Published</Badge>
              ) : (
                <Badge color="yellow">Hidden</Badge>
              )}
            </Table.Td>
            <Table.Td>
              {row.devtoUrl ? (
                <Anchor href={row.devtoUrl} target="_blank" rel="noopener noreferrer" size="sm">
                  {row.devtoId ? `#${row.devtoId}` : 'Live'}
                </Anchor>
              ) : (
                <Text size="sm" c="dimmed">
                  Not posted
                </Text>
              )}
            </Table.Td>
            <Table.Td>
              <PublishToDevtoButton
                slug={row.slug}
                label={row.devtoId ? 'Update on Dev.to' : 'Publish to Dev.to'}
                size="xs"
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
