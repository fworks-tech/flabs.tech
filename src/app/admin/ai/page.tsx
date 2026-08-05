import { Badge, Card, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from "@mantine/core";
import { AiRequestsChart, AiTokensChart } from "@/components/admin/AiCharts";
import {
  getAbuseOverview,
  getAiDaySeries,
  getAiTotals,
  getRecentAiEvents,
} from "@/lib/ai-stats";

export const metadata = {
  robots: { index: false, follow: false },
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default async function AdminAiPage() {
  const [series, totals, recent, abuse] = await Promise.all([
    getAiDaySeries(14),
    getAiTotals(7),
    getRecentAiEvents(30),
    getAbuseOverview(),
  ]);

  return (
    <Stack gap="xl">
      <Stack gap="4">
        <Title order={2}>AI Assistant</Title>
        <Text size="sm" c="dimmed">
          Chat usage, abuse pipeline state, and recent requests (14 days).
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Requests (7d)</Text>
          <Text size="xl" fw={700}>{totals.requests}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Tokens in</Text>
          <Text size="xl" fw={700}>{formatTokens(totals.tokensIn)}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Tokens out</Text>
          <Text size="xl" fw={700}>{formatTokens(totals.tokensOut)}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Blocked</Text>
          <Text size="xl" fw={700}>{totals.blocked}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Injection hits</Text>
          <Text size="xl" fw={700}>{totals.injection}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Active quarantines</Text>
          <Text size="xl" fw={700}>{abuse.quarantines.length}</Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">Requests vs blocked (14d)</Title>
          <AiRequestsChart data={series} />
        </Paper>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">Tokens (14d)</Title>
          <AiTokensChart data={series} />
        </Paper>
      </SimpleGrid>

      <Paper withBorder p="lg">
        <Title order={4} mb="md">Recent requests</Title>
        {recent.length === 0 ? (
          <Text c="dimmed" size="sm">No requests recorded yet.</Text>
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
              {recent.map((ev, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <Text size="xs" c="dimmed">{new Date(ev.t).toLocaleString()}</Text>
                  </Table.Td>
                  <Table.Td>{ev.model}</Table.Td>
                  <Table.Td>{ev.tokensIn}</Table.Td>
                  <Table.Td>{ev.tokensOut}</Table.Td>
                  <Table.Td>{ev.tier}</Table.Td>
                  <Table.Td>
                    <Group gap="6">
                      {ev.blocked && <Badge color="red" size="xs">blocked</Badge>}
                      {ev.injection && <Badge color="orange" size="xs">injection</Badge>}
                      {!ev.blocked && !ev.injection && <Text size="xs" c="dimmed">—</Text>}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">Investigation cases</Title>
          {abuse.cases.length === 0 ? (
            <Text c="dimmed" size="sm">No open cases.</Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Actor</Table.Th>
                  <Table.Th>Kind</Table.Th>
                  <Table.Th>Detail</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {abuse.cases.map((c) => (
                  <Table.Tr key={c.key}>
                    <Table.Td>
                      <Text size="xs" ff="monospace">{c.key}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="xs">{c.kind ?? "—"}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" lineClamp={1}>{c.detail ?? "—"}</Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">Quarantined actors</Title>
          {abuse.quarantines.length === 0 ? (
            <Text c="dimmed" size="sm">Nothing quarantined.</Text>
          ) : (
            <Stack gap="4">
              {abuse.quarantines.map((key) => (
                <Text key={key} size="xs" ff="monospace">{key}</Text>
              ))}
            </Stack>
          )}
        </Paper>
      </SimpleGrid>
    </Stack>
  );
}
