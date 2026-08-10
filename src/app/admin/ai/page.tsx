import { Card, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { AiRequestsChart, AiTokensChart } from '@/components/admin/AiCharts';
import { getAbuseOverview, getAiDaySeries, getAiTotals, getRecentAiEvents } from '@/lib/ai-stats';
import { InvestigationCasesTable, QuarantinedActors, RecentRequestsTable } from './AiTables';
import { LastUpdated } from '../LastUpdated';

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
        <LastUpdated />
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Requests (7d)
          </Text>
          <Text size="xl" fw={700}>
            {totals.requests}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Tokens in
          </Text>
          <Text size="xl" fw={700}>
            {formatTokens(totals.tokensIn)}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Tokens out
          </Text>
          <Text size="xl" fw={700}>
            {formatTokens(totals.tokensOut)}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Blocked
          </Text>
          <Text size="xl" fw={700}>
            {totals.blocked}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Injection hits
          </Text>
          <Text size="xl" fw={700}>
            {totals.injection}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Active quarantines
          </Text>
          <Text size="xl" fw={700}>
            {abuse.quarantines.length}
          </Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">
            Requests vs blocked (14d)
          </Title>
          <AiRequestsChart data={series} />
        </Paper>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">
            Tokens (14d)
          </Title>
          <AiTokensChart data={series} />
        </Paper>
      </SimpleGrid>

      <RecentRequestsTable rows={recent} />

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <InvestigationCasesTable rows={abuse.cases} />
        <QuarantinedActors rows={abuse.quarantines} />
      </SimpleGrid>
    </Stack>
  );
}
