import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { baseURL } from "@/config";
import { Certificate } from "@/features/quiz/components/Certificate";
import { ShareSection } from "@/features/blog/ShareSection";
import { store } from "@/lib/abuse/store";
import type { ScorePayload } from "@/features/quiz/lib/leaderboard";
import { rankMeta } from "@/features/quiz/lib/ranking";
import { generateMeta } from "@/lib/seo";

const ATTEMPT_TTL_SECONDS = 7 * 24 * 60 * 60;

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

function ogImageUrl(payload: ScorePayload): string {
  const params = new URLSearchParams({
    score: String(payload.score),
    total: String(payload.total),
    correct: String(payload.correct),
    streak: String(payload.maxStreak),
    name: payload.displayName,
  });
  return `/api/og/generate?${params.toString()}`;
}

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { id } = await params;
  const attempt = await store.get<ScorePayload>(`quiz:attempt:${id}`);
  if (!attempt) {
    return generateMeta({
      title: "DevSprint result",
      description: "A DevSprint quiz result on flabs.tech.",
      baseURL,
      path: `/quiz/result/${id}`,
    });
  }

  const title = `${attempt.displayName} scored ${attempt.score} on DevSprint`;
  return {
    ...generateMeta({
      title,
      description: `DevSprint result: ${attempt.score} points, ${attempt.correct}/${attempt.total} correct, max streak ${attempt.maxStreak}.`,
      baseURL,
      image: ogImageUrl(attempt),
      path: `/quiz/result/${id}`,
    }),
    alternates: { canonical: `${baseURL}/quiz/result/${id}` },
  };
}

export default async function QuizResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  const attempt = await store.get<ScorePayload>(`quiz:attempt:${id}`);

  if (!attempt) {
    notFound();
  }

  const rank = rankMeta(attempt.correct, attempt.total);
  const accuracy = attempt.total === 0 ? 0 : attempt.correct / attempt.total;
  const shareUrl = `${baseURL}/quiz/result/${id}`;
  const shareText = `I scored ${attempt.score} on DevSprint — think you can beat me?`;

  return (
    <Stack maw={820} pt="24" mx="auto" align="center" gap="lg">
      <Paper withBorder p="xl" radius="md" w="100%" maw={560}>
        <Stack align="center" gap="md">
          <Title order={2}>DevSprint result</Title>
          <Group gap="xs">
            <Text size="sm" c="dimmed" data-testid="result-name">
              {attempt.displayName}
            </Text>
            <Text size="sm" fw={700} data-testid="result-rank">
              · {rank.badge}
            </Text>
          </Group>
          <Text className="quiz-result-score" fw={900} style={{ fontSize: "4rem", lineHeight: 1 }} data-testid="result-score">
            {attempt.score}
          </Text>
          <Text size="sm" c="dimmed">
            / {attempt.total} · {Math.round(accuracy * 100)}% accuracy · max streak{" "}
            {attempt.maxStreak}
          </Text>
          <Button
            component="a"
            href="/quiz"
            variant="light"
            leftSection={<IconArrowLeft size={16} aria-hidden="true" />}
            data-testid="play-again"
          >
            Play DevSprint
          </Button>
        </Stack>
      </Paper>

      <Certificate
        displayName={attempt.displayName}
        score={attempt.score}
        correct={attempt.correct}
        total={attempt.total}
        maxStreak={attempt.maxStreak}
      />

      <ShareSection title="DevSprint result" url={shareUrl} shareText={shareText} />

      <Text size="xs" c="dimmed">
        Result links expire after {ATTEMPT_TTL_SECONDS / 86400} days.
      </Text>
    </Stack>
  );
}
