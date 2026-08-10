'use client';

import { Badge, Button, Card, Group, List, Stack, Text, Title } from '@mantine/core';
import { IconBolt, IconTrophy } from '@tabler/icons-react';

import type { QuizQuestion } from '@/features/quiz/data/questions';
import { useLeaderboard } from '@/features/quiz/hooks/useLeaderboard';
import { useRatings } from '@/features/quiz/hooks/useRatings';
import { trackEvent } from '@/lib/analytics';
import { DailyQuestionCard } from './DailyQuestionCard';
import { LeaderboardPanel } from './LeaderboardPanel';
import styles from './QuizStartCard.module.scss';

interface QuizStartCardProps {
  bestScore: number;
  bestStreak: number;
  daily: QuizQuestion;
  onStart: () => void;
}

export function QuizStartCard({ bestScore, bestStreak, daily, onStart }: QuizStartCardProps) {
  const leaderboard = useLeaderboard();
  const ratings = useRatings();

  return (
    <Stack align="center" gap="lg" className={styles.wrap}>
      <Stack align="center" gap="4">
        <Title order={2} className={styles.title}>
          DevSprint
        </Title>
        <Text c="dimmed" size="sm">
          The JavaScript sprint — 20 questions, 3 lives, 20 seconds each.
        </Text>
      </Stack>

      {bestScore > 0 && (
        <Group gap="xs" className={styles.hint}>
          <IconTrophy size={18} aria-hidden="true" />
          <Text size="sm" data-testid="best-score">
            Best score: {bestScore}
            {bestStreak > 0 ? ` · best streak ${bestStreak}` : ''}
          </Text>
        </Group>
      )}

      <DailyQuestionCard question={daily} />

      <Card withBorder p="md" radius="md" maw={420} className={styles.rules}>
        <List size="sm" spacing="xs">
          <List.Item icon={<IconBolt size={16} aria-hidden="true" />}>
            20s per question — correct answers earn a 2s bonus
          </List.Item>
          <List.Item icon={<IconBolt size={16} aria-hidden="true" />}>
            Streaks multiply your points (up to x5)
          </List.Item>
          <List.Item icon={<IconBolt size={16} aria-hidden="true" />}>
            3 lives. Wrong answer or timeout — you lose one
          </List.Item>
          <List.Item icon={<IconBolt size={16} aria-hidden="true" />}>
            Score 80%+ to unlock referral opportunities
          </List.Item>
        </List>
      </Card>

      <div className={styles.leaderboard}>
        <LeaderboardPanel
          entries={leaderboard.entries}
          loading={leaderboard.loading}
          error={leaderboard.error}
          week={leaderboard.week}
          onWeekChange={leaderboard.switchWeek}
          highlightId={null}
        />
      </div>

      {ratings && ratings.total > 0 && ratings.recommendPct !== null && (
        <Group gap="xs" data-testid="ratings-stat" className={styles.ratings}>
          <Text size="sm" c="dimmed">
            {ratings.recommendPct}% of players recommend this quiz
          </Text>
        </Group>
      )}

      <Button
        size="lg"
        onClick={() => {
          trackEvent('quiz_start', { questionCount: 20 });
          onStart();
        }}
        data-testid="start-quiz"
        className={styles.startButton}
        autoFocus
      >
        Start the sprint
      </Button>
      <Text size="xs" c="dimmed" className={styles.hint}>
        Answer with 1–4 or A–D. Good luck!
      </Text>
    </Stack>
  );
}
