"use client";

import { Paper, Text } from "@mantine/core";
import { IconClockExclamation, IconCheck, IconX } from "@tabler/icons-react";

import styles from "./QuizFeedbackBar.module.scss";

interface QuizFeedbackBarProps {
  correct: boolean;
  timedOut: boolean;
  explanation: string;
  points: number;
}

/**
 * Post-answer feedback: green/red flash, points flyout and the WHY for
 * the question. Announced to screen readers via aria-live.
 */
export function QuizFeedbackBar({ correct, timedOut, explanation, points }: QuizFeedbackBarProps) {
  const Icon = correct ? IconCheck : timedOut ? IconClockExclamation : IconX;
  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      className={correct ? styles.correct : styles.wrong}
      role="status"
      aria-live="polite"
      data-testid="feedback-bar"
    >
      <Text fw={700} size="md" component="p">
        {correct ? (
          <>
            <Icon className={styles.icon} size={20} aria-hidden="true" /> Correct! +{points} pts
          </>
        ) : timedOut ? (
          <>
            <Icon className={styles.icon} size={20} aria-hidden="true" /> Time&apos;s up!
          </>
        ) : (
          <>
            <Icon className={styles.icon} size={20} aria-hidden="true" /> Not quite
          </>
        )}
      </Text>
      <Text size="sm" c="dimmed" className={styles.explanation} component="p">
        {explanation}
      </Text>
    </Paper>
  );
}
