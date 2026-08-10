import { Card, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { DevicePie, TopPagesChart, TrafficChart } from "@/components/admin/AdminCharts";
import { getDaySeries, getRecentEvents, getTopPages, getTotals } from "@/lib/tracking-store";
import { RecentEventsTable } from "./AnalyticsTables";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const [series, totals, topPages, recent] = await Promise.all([
    getDaySeries(14),
    getTotals(7),
    getTopPages(7, 8),
    getRecentEvents(40),
  ]);

  const deviceData = Object.entries(totals.devices)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  return (
    <Stack gap="xl">
      <Stack gap="4">
        <Title order={2}>Analytics</Title>
        <Text size="sm" c="dimmed">
          Consent-first UX tracking over the last 14 days (self-hosted, anonymous).
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Pageviews (7d)</Text>
          <Text size="xl" fw={700}>{totals.pageviews}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Unique visitors</Text>
          <Text size="xl" fw={700}>{totals.uniques}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Sessions</Text>
          <Text size="xl" fw={700}>{totals.sessions}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">New visitors</Text>
          <Text size="xl" fw={700}>{totals.newVisitors}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Returning</Text>
          <Text size="xl" fw={700}>{totals.returningVisitors}</Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">Chat messages</Text>
          <Text size="xl" fw={700}>{series.reduce((a, d) => a + d.chatMessages, 0)}</Text>
        </Card>
      </SimpleGrid>

      <Paper withBorder p="lg">
        <Title order={4} mb="md">Traffic (14 days)</Title>
        <TrafficChart data={series} />
      </Paper>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">Top pages (7d)</Title>
          <TopPagesChart
            data={topPages.map(([path, views]) => ({ path: path === "/" ? "/ (home)" : path, views }))}
          />
        </Paper>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">Devices (7d)</Title>
          {deviceData.length === 0 ? (
            <Text c="dimmed" size="sm">No data yet.</Text>
          ) : (
            <DevicePie data={deviceData} />
          )}
        </Paper>
      </SimpleGrid>

      <RecentEventsTable rows={recent} />
    </Stack>
  );
}
