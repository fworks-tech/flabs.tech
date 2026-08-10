"use client";

import { Badge, Paper, Table, Text, Title } from "@mantine/core";

/**
 * Client-side analytics table. `Table.Thead/Tr/Th/Tbody/Td` are static
 * properties on the `"use client"` `Table` module — compound access from
 * a Server Component resolves to `undefined` (React error #130).
 * Receives serializable event rows from the server page.
 */

export interface AnalyticsEventRow {
  t: number;
  ty: string;
  p?: string;
  d?: string;
  b?: string;
}

export function RecentEventsTable({ rows }: { rows: AnalyticsEventRow[] }) {
  return (
    <Paper withBorder p="lg">
      <Title order={4} mb="md">Recent events</Title>
      {rows.length === 0 ? (
        <Text c="dimmed" size="sm">
          No events recorded yet — tracking only runs after consent.
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Event</Table.Th>
              <Table.Th>Path</Table.Th>
              <Table.Th>Device</Table.Th>
              <Table.Th>Browser</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((ev, i) => (
              <Table.Tr key={i}>
                <Table.Td>
                  <Text size="xs" c="dimmed">{new Date(ev.t).toLocaleString()}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" size="xs">{ev.ty}</Badge>
                </Table.Td>
                <Table.Td>{ev.p ?? "—"}</Table.Td>
                <Table.Td>{ev.d ?? "—"}</Table.Td>
                <Table.Td>{ev.b ?? "—"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}
