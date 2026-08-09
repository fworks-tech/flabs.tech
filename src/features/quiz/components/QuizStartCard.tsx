"use client";

import { Badge, Button, Card, Group, List, Stack, Text, Title } from "@mantine/core";
import { IconBolt, IconCalendarEvent, IconHeart, IconTrophy } from "@tabler/icons-react";

import type { QuizQuestion } from "@/features/quiz/data/questions";
import { useLeaderboard } from "@/features/quiz/hooks/useLeaderboard";
import { useRatings } from "@/features/quiz/hooks/useRatings";
import { LeaderboardPanel } from "./LeaderboardPanel";
import styles from "./QuizStartCard.module.scss";

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
          The Micro1 JavaScript sprint — 20 questions, 3 lives, 15 seconds each.
        </Text>
      </Stack>

      {bestScore > 0 && (
        <Group gap="xs">
          <IconTrophy size={18} aria-hidden="true" />
          <Text size="sm" data-testid="best-score">
            Best score: {bestScore}
            {bestStreak > 0 ? ` · best streak ${bestStreak}` : ""}
          </Text>
        </Group>
      )}

      <Card withBorder p="md" radius="md" className={styles.daily} data-testid="daily-question">
        <Group gap="xs" wrap="nowrap">
          <IconCalendarEvent size={18} aria-hidden="true" />
          <Badge color="grape" variant="light" size="sm">
            Daily challenge
          </Badge>
        </Group>
        <Text size="sm" mt="6">
          {daily.prompt}
        </Text>
      </Card>

      <Card withBorder p="md" radius="md" maw={420}>
        <List size="sm" spacing="xs">
          <List.Item icon={<IconBolt size={16} aria-hidden="true" />}>
            15s per question — correct answers earn a 2s bonus
          </List.Item>
          <List.Item icon={<IconBolt size={16} aria-hidden="true" />}>
            Streaks multiply your points (up to x5)
          </List.Item>
          <List.Item icon={<IconBolt size={16} aria-hidden="true" />}>
            3 lives. Wrong answer or timeout — you lose one
          </List.Item>
          <List.Item icon={<IconBolt size={16} aria-hidden="true" />}>
            Reach 80% accuracy to get matched with top US companies
          </List.Item>
        </List>
      </Card>

      <LeaderboardPanel
        entries={leaderboard.entries}
        loading={leaderboard.loading}
        error={leaderboard.error}
        week={leaderboard.week}
        onWeekChange={leaderboard.switchWeek}
        highlightId={null}
      />

      {ratings && ratings.total > 0 && ratings.recommendPct !== null && (
        <Group gap="xs" data-testid="ratings-stat">
          <IconHeart size={18} aria-hidden="true" />
          <Text size="sm" c="dimmed">
            {ratings.recommendPct}% of players recommend this quiz
          </Text>
        </Group>
      )}

      <Button
        size="lg"
        onClick={onStart}
        data-testid="start-quiz"
        className={styles.startButton}
        autoFocus
      >
        Start the sprint
      </Button>
      <Text size="xs" c="dimmed">
        Answer with 1–4 or A–D. Good luck — Zara is watching.
      </Text>
    </Stack>
  );
}
