"use client";

import { Badge, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";

import { rankMeta } from "@/features/quiz/lib/ranking";
import styles from "./GameOverCard.module.scss";

export interface GameOverStats {
  score: number;
  correctCount: number;
  total: number;
  maxStreak: number;
  livesLeft: number;
  durationMs: number;
}

interface GameOverCardProps {
  stats: GameOverStats;
  onRetry: () => void;
}

function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}

export function GameOverCard({ stats, onRetry }: GameOverCardProps) {
  const accuracy = stats.total === 0 ? 0 : stats.correctCount / stats.total;
  const rank = rankMeta(stats.correctCount, stats.total);

  return (
    <Paper withBorder p="xl" radius="md" className={styles.card} role="status" aria-live="polite">
      <Stack align="center" gap="md">
        <Title order={2}>Sprint complete</Title>

        <Group gap="xs">
          <Badge size="lg" color="grape" variant="gradient" data-testid="rank-badge">
            {rank.badge}
          </Badge>
          <Text size="sm" c="dimmed">
            {rank.copy}
          </Text>
        </Group>

        <Text className={styles.score} fw={900} data-testid="final-score">
          {stats.score}
        </Text>
        <Text size="sm" c="dimmed">
          points
        </Text>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" className={styles.stats}>
          <Stack gap="0" align="center">
            <Text fw={700} data-testid="stat-accuracy">
              {Math.round(accuracy * 100)}%
            </Text>
            <Text size="xs" c="dimmed">
              accuracy
            </Text>
          </Stack>
          <Stack gap="0" align="center">
            <Text fw={700} data-testid="stat-correct">
              {stats.correctCount}/{stats.total}
            </Text>
            <Text size="xs" c="dimmed">
              correct
            </Text>
          </Stack>
          <Stack gap="0" align="center">
            <Text fw={700} data-testid="stat-streak">
              {stats.maxStreak}
            </Text>
            <Text size="xs" c="dimmed">
              max streak
            </Text>
          </Stack>
          <Stack gap="0" align="center">
            <Text fw={700} data-testid="stat-duration">
              {formatDuration(stats.durationMs)}
            </Text>
            <Text size="xs" c="dimmed">
              time
            </Text>
          </Stack>
        </SimpleGrid>

        <Button size="md" variant="light" onClick={onRetry} data-testid="retry-quiz">
          Run it back
        </Button>
      </Stack>
    </Paper>
  );
}
