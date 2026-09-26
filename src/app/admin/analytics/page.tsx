import { Badge, Card, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { DevicePie, FunnelChart, TopPagesChart, TrafficChart } from '@/components/admin/AdminCharts';
import { storageBackend } from '@/lib/abuse/store';
import { getDaySeries, getEngagement, getRecentEvents, getTopPages, getTotals } from '@/lib/tracking-store';
import { RecentEventsTable } from './AnalyticsTables';
import { LastUpdated } from '../LastUpdated';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const [series, totals, topPages, recent, engagement] = await Promise.all([
    getDaySeries(14),
    getTotals(7),
    getTopPages(7, 8),
    getRecentEvents(40),
    getEngagement(7),
  ]);

  const deviceData = Object.entries(totals.devices)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const browserData = Object.entries(engagement.browsers)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const scrollData = Object.entries(engagement.scrollDepth)
    .map(([stage, value]) => ({ stage: `${stage}%`, value }))
    .sort((a, b) => Number(a.stage.replace('%', '')) - Number(b.stage.replace('%', '')));

  const quizData = [
    { stage: 'Started', value: engagement.quiz.starts },
    { stage: 'Completed', value: engagement.quiz.completes },
  ].filter((d) => d.value > 0);

  const hasTraffic = series.some((d) => d.pageviews > 0 || d.uniques > 0 || d.sessions > 0);

  return (
    <Stack gap="xl">
      <Stack gap="4">
        <Group gap="sm" align="center">
          <Title order={2}>Analytics</Title>
          <Badge
            size="sm"
            variant="light"
            color={storageBackend === 'redis' ? 'teal' : 'orange'}
            data-testid="analytics-backend-badge"
          >
            {storageBackend === 'redis' ? 'Redis (persistent)' : 'In-memory (resets on cold start)'}
          </Badge>
        </Group>
        <Text size="sm" c="dimmed">
          Consent-first UX tracking over the last 14 days (self-hosted, anonymous).
        </Text>
        <LastUpdated />
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Pageviews (7d)
          </Text>
          <Text size="xl" fw={700}>
            {totals.pageviews}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Unique visitors (7d)
          </Text>
          <Text size="xl" fw={700}>
            {totals.uniques}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Sessions (7d)
          </Text>
          <Text size="xl" fw={700}>
            {totals.sessions}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            New visitors (7d)
          </Text>
          <Text size="xl" fw={700}>
            {totals.newVisitors}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Returning (7d)
          </Text>
          <Text size="xl" fw={700}>
            {totals.returningVisitors}
          </Text>
        </Card>
        <Card withBorder padding="md">
          <Text size="xs" c="dimmed">
            Chat messages (7d)
          </Text>
          <Text size="xl" fw={700}>
            {series.reduce((a, d) => a + d.chatMessages, 0)}
          </Text>
        </Card>
      </SimpleGrid>

      <Text size="xs" c="dimmed">
        Unique visitors is the sum of per-day uniques (a visitor returning on multiple days counts
        once per day). New/returning are counted per session start.
      </Text>

      <Paper withBorder p="lg">
        <Title order={4} mb="md">
          Traffic (14 days)
        </Title>
        {hasTraffic ? (
          <TrafficChart data={series} />
        ) : (
          <Text c="dimmed" size="sm">
            No traffic yet — analytics activate after visitor consent.
          </Text>
        )}
      </Paper>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">
            Top pages (7d)
          </Title>
          {topPages.length === 0 ? (
            <Text c="dimmed" size="sm">
              No page views recorded yet.
            </Text>
          ) : (
            <TopPagesChart
              data={topPages.map(([path, views]) => ({
                path: path === '/' ? '/ (home)' : path,
                views,
              }))}
            />
          )}
        </Paper>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">
            Devices (7d)
          </Title>
          {deviceData.length === 0 ? (
            <Text c="dimmed" size="sm">
              No data yet.
            </Text>
          ) : (
            <DevicePie data={deviceData} />
          )}
        </Paper>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 3 }}>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">
            Browsers (7d)
          </Title>
          {browserData.length === 0 ? (
            <Text c="dimmed" size="sm">
              No data yet.
            </Text>
          ) : (
            <DevicePie data={browserData} />
          )}
        </Paper>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">
            Scroll depth (7d)
          </Title>
          {scrollData.every((d) => d.value === 0) ? (
            <Text c="dimmed" size="sm">
              No scrolls recorded yet.
            </Text>
          ) : (
            <FunnelChart data={scrollData} />
          )}
        </Paper>
        <Paper withBorder p="lg">
          <Title order={4} mb="md">
            DevSprint funnel (7d)
          </Title>
          {quizData.length === 0 ? (
            <Text c="dimmed" size="sm">
              No quiz sessions yet.
            </Text>
          ) : (
            <FunnelChart data={quizData} />
          )}
        </Paper>
      </SimpleGrid>

      <RecentEventsTable rows={recent} />
    </Stack>
  );
}
