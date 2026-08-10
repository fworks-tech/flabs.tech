'use client';

import { ActionIcon, Paper, Text } from '@mantine/core';
import { IconClockExclamation, IconCheck, IconFlag, IconX } from '@tabler/icons-react';

import styles from './QuizFeedbackBar.module.scss';

interface QuizFeedbackBarProps {
  correct: boolean;
  timedOut: boolean;
  explanation: string;
  /** Code snippet shown alongside the explanation on WRONG answers. */
  explanationCode?: string;
  /** Points earned — omitted (e.g. daily challenge) hides the "+X pts" flyout. */
  points?: number;
  /** Opens the "report issue" modal for the answered question. */
  onReport?: () => void;
}

/**
 * Post-answer feedback: green/red flash, points flyout and the WHY for
 * the question. On wrong answers an `explanationCode` snippet is shown
 * so players can learn from the mistake. Announced to screen readers
 * via aria-live.
 */
export function QuizFeedbackBar({
  correct,
  timedOut,
  explanation,
  explanationCode,
  points,
  onReport,
}: QuizFeedbackBarProps) {
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
            <Icon className={styles.icon} size={20} aria-hidden="true" /> Correct!
            {points !== undefined && <span className={styles.points}> +{points} pts</span>}
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
        {onReport && (
          <ActionIcon
            variant="subtle"
            size="sm"
            ml="xs"
            aria-label="Report issue with this question"
            onClick={onReport}
            data-testid="report-issue-feedback"
          >
            <IconFlag size={16} aria-hidden="true" />
          </ActionIcon>
        )}
      </Text>
      <Text size="sm" c="dimmed" className={styles.explanation} component="p">
        {explanation}
      </Text>
      {!correct && explanationCode && (
        <pre className={styles.code} data-testid="explanation-code">
          <code>{explanationCode}</code>
        </pre>
      )}
    </Paper>
  );
}
