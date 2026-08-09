"use client";

import { ActionIcon, Button, Group, Paper, Text } from "@mantine/core";
import { IconFlag } from "@tabler/icons-react";
import { useEffect, useRef } from "react";

import type { QuizQuestion } from "@/features/quiz/data/questions";
import { TimerRing } from "./TimerRing";
import styles from "./QuizQuestionCard.module.scss";

interface QuizQuestionCardProps {
  question: QuizQuestion;
  remainingMs: number;
  durationMs: number;
  /** Index of the player's pick, or null while still answering. */
  selectedIndex: number | null;
  disabled: boolean;
  onAnswer: (index: number) => void;
  /** Hide the countdown ring (e.g. on the reveal after answering). */
  showTimer?: boolean;
  /** Opens the "report issue" modal for this question. */
  onReport?: () => void;
}

const KEY_INDICES: Record<string, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  a: 0,
  b: 1,
  c: 2,
  d: 3,
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

function answerClass(index: number, selectedIndex: number | null, question: QuizQuestion) {
  if (selectedIndex === null) return "";
  if (index === question.correctIndex) return styles.correct;
  if (index === selectedIndex) return styles.wrong;
  return styles.dimmed;
}

export function QuizQuestionCard({
  question,
  remainingMs,
  durationMs,
  selectedIndex,
  disabled,
  onAnswer,
  showTimer = true,
  onReport,
}: QuizQuestionCardProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButtonRef.current?.focus();
  }, [question.id]);

  useEffect(() => {
    if (disabled) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key in KEY_INDICES) {
        event.preventDefault();
        onAnswer(KEY_INDICES[event.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [disabled, onAnswer]);

  return (
    <Paper withBorder p="lg" radius="md" className={styles.card} role="group" aria-label="Question">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {question.category.replace("-", " ")}
          </Text>
          <Text size="lg" fw={600} mt="4" component="p">
            {question.prompt}
          </Text>
        </div>
        <Group gap="xs" wrap="nowrap">
          {onReport && (
            <ActionIcon
              variant="subtle"
              size="sm"
              aria-label="Report issue with this question"
              onClick={onReport}
              data-testid="report-issue"
            >
              <IconFlag size={16} aria-hidden="true" />
            </ActionIcon>
          )}
          {showTimer && <TimerRing remainingMs={remainingMs} durationMs={durationMs} />}
        </Group>
      </Group>

      {question.code && (
        <pre className={styles.code} data-testid="question-code">
          <code>{question.code}</code>
        </pre>
      )}

      <Group className={styles.answers} gap="8">
        {question.answers.map((answer, index) => (
          <Button
            key={`${question.id}-${index}`}
            ref={index === 0 ? firstButtonRef : undefined}
            className={`${styles.answer} ${answerClass(index, selectedIndex, question)}`}
            fullWidth
            justify="flex-start"
            variant={selectedIndex === null ? "light" : "subtle"}
            disabled={disabled}
            onClick={() => onAnswer(index)}
            data-correct={selectedIndex !== null && index === question.correctIndex}
            data-wrong={selectedIndex === index && selectedIndex !== question.correctIndex}
            data-testid={`answer-${index}`}
          >
            <Text component="span" ff="monospace" c="dimmed" w={20}>
              {String.fromCharCode(65 + index)}.
            </Text>
            <Text component="span" ta="left">
              {answer}
            </Text>
          </Button>
        ))}
      </Group>
    </Paper>
  );
}
