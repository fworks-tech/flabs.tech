import { Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { getAiTotals } from "@/lib/ai-stats";
import { getTotals } from "@/lib/tracking-store";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const [analytics, ai] = await Promise.all([getTotals(7), getAiTotals(7)]);

  return (
    <Stack gap="xl">
      <Stack gap="4">
        <Title order={2}>Dashboard</Title>
        <Text size="sm" c="dimmed">
          Overview of the last 7 days across the internal systems.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Pageviews</Text>
          <Text size="xl" fw={700}>{analytics.pageviews}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Unique visitors</Text>
          <Text size="xl" fw={700}>{analytics.uniques}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Sessions</Text>
          <Text size="xl" fw={700}>{analytics.sessions}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Chat requests</Text>
          <Text size="xl" fw={700}>{ai.requests}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Chat blocked</Text>
          <Text size="xl" fw={700}>{ai.blocked}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">AI tokens (in/out)</Text>
          <Text size="xl" fw={700}>{ai.tokensIn + ai.tokensOut}</Text>
        </Card>
      </SimpleGrid>

      <Group gap="md">
        <Text size="sm" c="dimmed">
          Jump into the details: Drafts, AI Assistant, or Analytics use the nav above.
        </Text>
      </Group>
    </Stack>
  );
}
