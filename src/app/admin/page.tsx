import { Alert, Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { getAiTotals } from '@/lib/ai-stats';
import { getTotals } from '@/lib/tracking-store';
import { LastUpdated } from './LastUpdated';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const [analytics, ai] = await Promise.all([getTotals(7), getAiTotals(7)]);

  const hasData = analytics.pageviews > 0 || ai.requests > 0;

  return (
    <Stack gap="xl">
      <Stack gap="4">
        <Title order={2}>Dashboard</Title>
        <Text size="sm" c="dimmed">
          Overview of the last 7 days across the internal systems.
        </Text>
        <LastUpdated />
      </Stack>

      {!hasData && (
        <Alert color="blue" variant="light" title="No data yet">
          Analytics tracking activates after visitor consent; chat requests appear after the first
          conversation with the AI assistant.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 7 }}>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Pageviews (7d)
          </Text>
          <Text size="xl" fw={700}>
            {analytics.pageviews}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Unique visitors (7d)
          </Text>
          <Text size="xl" fw={700}>
            {analytics.uniques}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Sessions (7d)
          </Text>
          <Text size="xl" fw={700}>
            {analytics.sessions}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Chat requests (7d)
          </Text>
          <Text size="xl" fw={700}>
            {ai.requests}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Chat blocked (7d)
          </Text>
          <Text size="xl" fw={700}>
            {ai.blocked}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            AI tokens in (7d)
          </Text>
          <Text size="xl" fw={700}>
            {formatTokens(ai.tokensIn)}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            AI tokens out (7d)
          </Text>
          <Text size="xl" fw={700}>
            {formatTokens(ai.tokensOut)}
          </Text>
        </Card>
      </SimpleGrid>

      <Text size="sm" c="dimmed">
        Jump into the details: Drafts, AI Assistant, or Analytics use the nav above.
      </Text>
    </Stack>
  );
}
