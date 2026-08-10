'use client';

import { Badge, Group, Paper, Stack, Table, Text, Title } from '@mantine/core';

/**
 * Client-side AI tables. `Table.Thead/Tr/Th/Tbody/Td` are static
 * properties on the `"use client"` `Table` module — compound access
 * from a Server Component resolves to `undefined` (React error #130).
 * Receives serializable data from the server page.
 */

export interface AiEventRow {
  t: number;
  model: string;
  tokensIn: number;
  tokensOut: number;
  tier: string;
  blocked: boolean;
  injection: boolean;
}

export interface AbuseCaseRow {
  key: string;
  kind?: string;
  detail?: string;
  severity: string;
  score: number;
  updatedAt?: number;
}

export interface QuarantineRow {
  key: string;
  tier: string;
  reason: string;
  expiresAt: number;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function RecentRequestsTable({ rows }: { rows: AiEventRow[] }) {
  return (
    <Paper withBorder p="lg">
      <Title order={4} mb="md">
        Recent requests
      </Title>
      {rows.length === 0 ? (
        <Text c="dimmed" size="sm">
          No requests recorded yet.
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Model</Table.Th>
              <Table.Th>Tokens in</Table.Th>
              <Table.Th>Tokens out</Table.Th>
              <Table.Th>Tier</Table.Th>
              <Table.Th>Flags</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((ev, i) => (
              <Table.Tr key={i}>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {new Date(ev.t).toLocaleString()}
                  </Text>
                </Table.Td>
                <Table.Td>{ev.model}</Table.Td>
                <Table.Td>{formatTokens(ev.tokensIn)}</Table.Td>
                <Table.Td>{formatTokens(ev.tokensOut)}</Table.Td>
                <Table.Td>{ev.tier}</Table.Td>
                <Table.Td>
                  <Group gap="6">
                    {ev.blocked && (
                      <Badge color="red" size="xs">
                        blocked
                      </Badge>
                    )}
                    {ev.injection && (
                      <Badge color="orange" size="xs">
                        injection
                      </Badge>
                    )}
                    {!ev.blocked && !ev.injection && (
                      <Text size="xs" c="dimmed">
                        —
                      </Text>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'gray',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
};

const TIER_COLORS: Record<string, string> = {
  throttle: 'yellow',
  'soft-quarantine': 'orange',
  'hard-block': 'red',
};

export function InvestigationCasesTable({ rows }: { rows: AbuseCaseRow[] }) {
  return (
    <Paper withBorder p="lg">
      <Title order={4} mb="md">
        Investigation cases
      </Title>
      {rows.length === 0 ? (
        <Text c="dimmed" size="sm">
          No open cases.
        </Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Actor</Table.Th>
              <Table.Th>Severity</Table.Th>
              <Table.Th>Kind</Table.Th>
              <Table.Th>Detail</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((c) => (
              <Table.Tr key={c.key}>
                <Table.Td>
                  <Text size="xs" ff="monospace">
                    {c.key}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={SEVERITY_COLORS[c.severity] ?? 'gray'} variant="light" size="xs">
                    {c.severity} · {Math.round(c.score * 100)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" size="xs">
                    {c.kind ?? '—'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" lineClamp={1}>
                    {c.detail ?? '—'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Paper>
  );
}

export function QuarantinedActors({ rows }: { rows: QuarantineRow[] }) {
  return (
    <Paper withBorder p="lg">
      <Title order={4} mb="md">
        Quarantined actors
      </Title>
      {rows.length === 0 ? (
        <Text c="dimmed" size="sm">
          Nothing quarantined.
        </Text>
      ) : (
        <Stack gap="4">
          {rows.map((q) => (
            <Group key={q.key} gap="8" wrap="nowrap" justify="space-between">
              <Group gap="8" wrap="nowrap" maw="60%">
                <Badge color={TIER_COLORS[q.tier] ?? 'gray'} variant="light" size="xs">
                  {q.tier}
                </Badge>
                <Text size="xs" ff="monospace" lineClamp={1}>
                  {q.key}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" lineClamp={1}>
                {q.reason || 'no reason'}
                {q.expiresAt > 0 ? ` · expires ${new Date(q.expiresAt).toLocaleTimeString()}` : ''}
              </Text>
            </Group>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
