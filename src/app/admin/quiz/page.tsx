import { Card, Group, Paper, SimpleGrid, Stack, Tabs, Text, Title } from "@mantine/core";

import { FeedbackTable } from "@/features/quiz/components/FeedbackTable";
import { getQuizOverview } from "@/features/quiz/lib/adminStats";

export const metadata = {
  robots: { index: false, follow: false },
};

function statCard(label: string, value: string | number, testId?: string) {
  return (
    <Card withBorder padding="md">
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="xl" fw={700} data-testid={testId}>{value}</Text>
    </Card>
  );
}

export default async function AdminQuizPage() {
  const overview = await getQuizOverview();
  const totalRatings = overview.ratings ? overview.ratings.up + overview.ratings.down : 0;
  const recommendPct =
    overview.ratings && totalRatings > 0
      ? Math.round((overview.ratings.up / totalRatings) * 100)
      : null;

  return (
    <Stack gap="xl">
      <Stack gap="4">
        <Title order={2}>Quiz</Title>
        <Text size="sm" c="dimmed">
          DevSprint feedback, ratings and attempt stats.
        </Text>
      </Stack>

      <Tabs defaultValue="feedback">
        <Tabs.List>
          <Tabs.Tab value="feedback">Feedback</Tabs.Tab>
          <Tabs.Tab value="stats">Stats</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="feedback" pt="md">
          <Paper withBorder p="lg">
            <Title order={4} mb="md">
              Question feedback ({overview.readFeedback}/{overview.feedbackTotal} read)
            </Title>
            <FeedbackTable items={overview.feedback} />
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="stats" pt="md">
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }}>
            {statCard("Attempts logged", overview.attempts, "stat-attempts")}
            {statCard("Feedback entries", overview.feedbackTotal, "stat-feedback")}
            {statCard("Ratings up", overview.ratings?.up ?? "—", "stat-up")}
            {statCard("Ratings down", overview.ratings?.down ?? "—", "stat-down")}
            {statCard(
              "Recommend",
              recommendPct === null ? "—" : `${recommendPct}%`,
              "stat-recommend",
            )}
            {statCard("Referral clicks", overview.referralClicks, "stat-referral")}
          </SimpleGrid>

          <Group mt="lg" gap="sm" wrap="nowrap">
            <Text size="sm" c="dimmed">
              Attempt records are keyed{" "}
              <Text component="span" ff="monospace" size="xs">
                quiz:attempt:*
              </Text>{" "}
              and expire after 7 days.
            </Text>
          </Group>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
