import { Stack, Text, Title } from '@mantine/core';

import { getQuizOverview } from '@/features/quiz/lib/adminStats';
import { QuizTabs } from './QuizTabs';
import { LastUpdated } from '../LastUpdated';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminQuizPage() {
  const overview = await getQuizOverview();

  return (
    <Stack gap="xl">
      <Stack gap="4">
        <Title order={2}>Quiz</Title>
        <Text size="sm" c="dimmed">
          DevSprint feedback, ratings and attempt stats.
        </Text>
        <LastUpdated />
      </Stack>

      <QuizTabs overview={overview} />
    </Stack>
  );
}
