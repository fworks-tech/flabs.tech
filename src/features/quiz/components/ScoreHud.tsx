"use client";

import { Badge, Group, Progress, Text } from "@mantine/core";
import { IconHeart, IconHeartFilled, IconTrophy } from "@tabler/icons-react";

import { MAX_LIVES } from "@/features/quiz/hooks/useQuizEngine";
import styles from "./ScoreHud.module.scss";

interface ScoreHudProps {
  score: number;
  streak: number;
  lives: number;
  answered: number;
  total: number;
}

/**
 * In-game HUD: animated score, streak multiplier, lives as hearts and a
 * progress bar. Screen readers get score/progress updates via aria-live.
 */
export function ScoreHud({ score, streak, lives, answered, total }: ScoreHudProps) {
  return (
    <Group className={styles.hud} justify="space-between" wrap="wrap">
      <div>
        <Text size="xs" c="dimmed" component="span">
          Score
        </Text>
        <Text
          size="xl"
          fw={800}
          className={`${styles.score} ${score > 0 ? styles.scoreChanged : ""}`}
          aria-live="polite"
          data-testid="score-value"
        >
          {score}
        </Text>
      </div>

      <div>
        <Text size="xs" c="dimmed" component="span">
          Streak
        </Text>
        <Group gap="4">
          {streak > 0 && (
            <Badge
              color="orange"
              variant="light"
              data-testid="streak-badge"
              className={styles.streakBadge}
            >
              x{streak + 1}
            </Badge>
          )}
          <Text size="sm" c="dimmed" data-testid="streak-value">
            {streak} streak
          </Text>
        </Group>
      </div>

      <div role="img" aria-label={`${lives} of ${MAX_LIVES} lives left`} data-testid="lives">
        {Array.from({ length: MAX_LIVES }, (_, i) =>
          i < lives ? (
            <IconHeartFilled key={i} size={18} className={styles.heart} aria-hidden="true" />
          ) : (
            <IconHeart key={i} size={18} className={styles.heartLost} aria-hidden="true" />
          ),
        )}
      </div>

      <Group gap="8" wrap="nowrap">
        <IconTrophy size={16} aria-hidden="true" />
        <Progress
          value={(answered / total) * 100}
          w={120}
          className={styles.progress}
          aria-label={`Question ${answered} of ${total}`}
          aria-live="polite"
          data-testid="progress-bar"
        />
        <Text size="sm" c="dimmed" ff="monospace">
          {answered}/{total}
        </Text>
      </Group>
    </Group>
  );
}
