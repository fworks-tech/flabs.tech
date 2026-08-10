'use client';

import { Badge, Button, Card, Group, Text } from '@mantine/core';
import { IconCalendarEvent, IconFlame } from '@tabler/icons-react';
import { useEffect } from 'react';

import type { QuizQuestion } from '@/features/quiz/data/questions';
import { useDailyHistory } from '@/features/quiz/hooks/useDailyHistory';
import { computeDailyStreak, todayKey } from '@/features/quiz/lib/daily';
import { trackEvent } from '@/lib/analytics';
import { QuizFeedbackBar } from './QuizFeedbackBar';
import styles from './DailyQuestionCard.module.scss';

interface DailyQuestionCardProps {
  question: QuizQuestion;
}

const KEY_INDICES: Record<string, number> = {
  '1': 0,
  '2': 1,
  '3': 2,
  '4': 3,
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
  if (selectedIndex === null) return '';
  if (index === question.correctIndex) return styles.correct;
  if (index === selectedIndex) return styles.wrong;
  return styles.dimmed;
}

/**
 * The answerable "Daily challenge" on the quiz start screen: one question
 * per UTC day, one attempt, instant feedback (with the learning code block
 * on wrong answers) and a consecutive-days streak.
 */
export function DailyQuestionCard({ question }: DailyQuestionCardProps) {
  const { attempts, recordAttempt } = useDailyHistory();
  const todayAttempt = attempts.find((a) => a.date === todayKey());
  const selected = todayAttempt?.selectedIndex ?? null;
  const streak = computeDailyStreak(attempts);

  const handleAnswer = (index: number) => {
    if (todayAttempt) return;
    const correct = question.correctIndex === index;
    recordAttempt({
      date: todayKey(),
      questionId: question.id,
      selectedIndex: index,
      correct,
    });
    trackEvent('quiz_daily_answer', { questionId: question.id, correct });
  };

  useEffect(() => {
    if (selected !== null) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key in KEY_INDICES) {
        event.preventDefault();
        handleAnswer(KEY_INDICES[event.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const answered = selected !== null;

  return (
    <Card withBorder p="md" radius="md" className={styles.card} data-testid="daily-question">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <IconCalendarEvent size={18} aria-hidden="true" />
          <Badge color="grape" variant="light" size="sm">
            Daily challenge
          </Badge>
        </Group>
        {streak > 0 && (
          <Text size="sm" c="dimmed" data-testid="daily-streak">
            <IconFlame size={14} className={styles.flame} aria-hidden="true" />
            {streak}-day streak
          </Text>
        )}
      </Group>

      <Text size="sm" mt="6" fw={600} component="p">
        {question.prompt}
      </Text>

      {question.code && (
        <pre className={styles.code} data-testid="daily-question-code">
          <code>{question.code}</code>
        </pre>
      )}

      <Group className={styles.answers} gap="8">
        {question.answers.map((answer, index) => (
          <Button
            key={`${question.id}-${index}`}
            className={`${styles.answer} ${answerClass(index, selected, question)}`}
            fullWidth
            justify="flex-start"
            variant={selected === null ? 'light' : 'subtle'}
            disabled={answered}
            onClick={() => handleAnswer(index)}
            data-correct={answered && index === question.correctIndex}
            data-wrong={answered && selected === index && index !== question.correctIndex}
            data-testid={`daily-answer-${index}`}
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

      {answered && (
        <QuizFeedbackBar
          correct={todayAttempt?.correct ?? question.correctIndex === selected}
          timedOut={false}
          explanation={question.explanation}
          explanationCode={question.explanationCode}
          points={undefined}
        />
      )}
    </Card>
  );
}
