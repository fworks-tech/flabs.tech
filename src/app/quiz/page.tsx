'use client';

import { Button, Group, Stack, Text } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AchievementToast } from '@/features/quiz/components/AchievementToast';
import { FeedbackModal } from '@/features/quiz/components/FeedbackModal';
import { GameOverCard } from '@/features/quiz/components/GameOverCard';
import { QuizFeedbackBar } from '@/features/quiz/components/QuizFeedbackBar';
import { QuizQuestionCard } from '@/features/quiz/components/QuizQuestionCard';
import { QuizStartCard } from '@/features/quiz/components/QuizStartCard';
import { ScoreHud } from '@/features/quiz/components/ScoreHud';
import { buildDeck, dailyQuestion, type QuizQuestion } from '@/features/quiz/data/questions';
import {
  evaluateAchievements,
  useAchievements,
  type AchievementId,
} from '@/features/quiz/hooks/useAchievements';
import { useCountdown } from '@/features/quiz/hooks/useCountdown';
import { useHighScore } from '@/features/quiz/hooks/useHighScore';
import { trackEvent } from '@/lib/analytics';
import {
  gameOverStats,
  useQuizEngine,
  type EngineState,
} from '@/features/quiz/hooks/useQuizEngine';

const QUESTION_TIME_MS = 20000;
/** Quick auto-advance after a correct answer — keeps the arcade pace. */
const CORRECT_FEEDBACK_MS = 1200;
/**
 * Learning pause after a wrong answer: hold the feedback (text + code
 * snippet) for up to 15s so players can study the mistake, or let them
 * click "Next" to advance sooner.
 */
const WRONG_FEEDBACK_MS = 15000;

/**
 * Best-effort attempt log via sendBeacon (fires once per finished game;
 * the browser flushes it even when the tab closes).
 */
function sendAttemptBeacon(state: Extract<EngineState, { phase: 'answered' }>) {
  try {
    const payload = {
      attemptId: crypto.randomUUID(),
      answers: state.answers.map(({ questionId, correct, timeMs }) => ({
        questionId,
        correct,
        timeMs,
      })),
      durationMs: Date.now() - state.startedAt,
    };
    navigator.sendBeacon(
      '/api/quiz/attempt',
      new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      }),
    );
  } catch {
    // best-effort: ignore beacon failures
  }
}

/**
 * Owns the per-question countdown. Remounted with `key={question.id}` so
 * the timer re-arms for each question; reports the time taken with each
 * answer so the engine can score it.
 */
function QuestionStage({
  question,
  bonusMs,
  onAnswer,
  onTimeout,
  onReport,
}: {
  question: QuizQuestion;
  bonusMs: number;
  onAnswer: (index: number, timeMs: number) => void;
  onTimeout: () => void;
  onReport: () => void;
}) {
  const duration = QUESTION_TIME_MS + bonusMs;
  const remaining = useCountdown(duration, true, onTimeout);
  return (
    <QuizQuestionCard
      question={question}
      remainingMs={remaining}
      durationMs={duration}
      selectedIndex={null}
      disabled={false}
      onAnswer={(index) => onAnswer(index, duration - remaining)}
      onReport={onReport}
    />
  );
}

export default function QuizPage() {
  const [state, dispatch] = useQuizEngine();
  const { bestScore, bestStreak, submitScore } = useHighScore();
  const { unlock } = useAchievements();
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementId[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  /** Seconds left in the wrong-answer learning pause (null when no pause). */
  const [feedbackSecondsLeft, setFeedbackSecondsLeft] = useState<number | null>(null);
  const daily = useMemo(() => dailyQuestion(), []);

  /**
   * Latest-render handler for "advance": records the finished game (best
   * score, achievements, attempt beacon, analytics) when the run ends,
   * then moves to the next question. Kept in a ref so both the auto-
   * advance timer and the "Next" button always call the freshest logic.
   * Assigned in an effect (not during render) to satisfy hook rules.
   */
  const advanceRef = useRef<(s: Extract<EngineState, { phase: 'answered' }>) => void>(() => {});
  useEffect(() => {
    advanceRef.current = (s) => {
      const willEnd = s.lives <= 0 || s.index + 1 >= s.deck.length;
      if (willEnd) {
        const correctCount = s.answers.filter((a) => a.correct).length;
        submitScore(s.score, s.maxStreak);
        const timedAnswers = s.answers.filter((a) => a.timeMs > 0);
        const averageTimeMs =
          timedAnswers.length > 0
            ? timedAnswers.reduce((sum, a) => sum + a.timeMs, 0) / timedAnswers.length
            : 0;
        const fresh = unlock(
          evaluateAchievements({
            correctCount,
            total: s.deck.length,
            livesLeft: s.lives,
            averageTimeMs,
            completed: s.lives > 0,
          }),
        );
        if (fresh.length > 0) setNewlyUnlocked(fresh);
        sendAttemptBeacon(s);
        trackEvent('quiz_complete', {
          score: s.score,
          accuracy: s.deck.length === 0 ? 0 : correctCount / s.deck.length,
          maxStreak: s.maxStreak,
          livesLeft: s.lives,
          durationMs: Date.now() - s.startedAt,
          rankTitle: (() => {
            const acc = s.deck.length === 0 ? 0 : correctCount / s.deck.length;
            if (acc >= 0.9) return 'Staff';
            if (acc >= 0.75) return 'Senior';
            if (acc >= 0.6) return 'Mid-Level';
            return 'Junior';
          })(),
        });
      }
      dispatch({ type: 'advance', now: Date.now() });
    };
  });

  const handleReport = useCallback(() => setReportOpen(true), []);

  const handleTimeout = useCallback(() => dispatch({ type: 'timeout' }), [dispatch]);

  const currentQuestion =
    state.phase === 'running' || state.phase === 'answered' ? state.deck[state.index] : null;
  const currentStreak = state.phase === 'running' || state.phase === 'answered' ? state.streak : 0;

  const handleAnswer = useCallback(
    (index: number, timeMs: number) => {
      dispatch({ type: 'answer', index, timeMs });
      if (currentQuestion) {
        trackEvent('quiz_answer', {
          questionId: currentQuestion.id,
          category: currentQuestion.category,
          correct: currentQuestion.correctIndex === index,
          timeMs: Math.round(timeMs),
          streak: currentStreak,
        });
      }
    },
    [dispatch, currentQuestion, currentStreak],
  );

  const answered = state.phase === 'answered' ? state : null;

  useEffect(() => {
    if (!answered) return;
    const delay = answered.correct ? CORRECT_FEEDBACK_MS : WRONG_FEEDBACK_MS;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => {
      advanceRef.current(answered);
    }, delay);
    let ticker: number | undefined;
    if (!answered.correct) {
      ticker = window.setInterval(() => {
        const left = Math.max(0, Math.ceil((delay - (Date.now() - startedAt)) / 1000));
        setFeedbackSecondsLeft(left);
      }, 250);
    }
    return () => {
      window.clearTimeout(timer);
      if (ticker !== undefined) window.clearInterval(ticker);
      setFeedbackSecondsLeft(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, answered?.correct]);

  useEffect(() => {
    if (state.phase !== 'answered') return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter') advanceRef.current(state);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const handleStart = useCallback(() => {
    dispatch({
      type: 'start',
      deck: buildDeck(Math.floor(Math.random() * 2 ** 31)),
      now: Date.now(),
    });
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    setNewlyUnlocked([]);
    dispatch({ type: 'retry' });
  }, [dispatch]);

  const inQuestionFlow = state.phase === 'running' || state.phase === 'answered';
  const question =
    state.phase === 'running' || state.phase === 'answered' ? state.deck[state.index] : null;

  return (
    <Stack maw={820} pt="24" mx="auto" align="center" gap="md">
      <AchievementToast newlyUnlocked={newlyUnlocked} />

      {state.phase === 'idle' && (
        <QuizStartCard
          bestScore={bestScore}
          bestStreak={bestStreak}
          daily={daily}
          onStart={handleStart}
        />
      )}

      {inQuestionFlow && question && (
        <>
          <ScoreHud
            score={state.score}
            streak={state.streak}
            lives={state.lives}
            answered={state.answers.length}
            total={state.deck.length}
          />
          {state.phase === 'running' && (
            <QuestionStage
              key={question.id}
              question={question}
              bonusMs={state.bonusMs}
              onAnswer={handleAnswer}
              onTimeout={handleTimeout}
              onReport={handleReport}
            />
          )}
          {state.phase === 'answered' && (
            <>
              <QuizQuestionCard
                question={question}
                showTimer={false}
                remainingMs={0}
                durationMs={QUESTION_TIME_MS}
                selectedIndex={state.selectedIndex}
                disabled
                onAnswer={(index) => handleAnswer(index, 0)}
                onReport={handleReport}
              />
              <QuizFeedbackBar
                correct={state.correct}
                timedOut={state.selectedIndex === -1}
                explanation={question.explanation}
                explanationCode={question.explanationCode}
                points={state.points}
                onReport={handleReport}
              />
              {!state.correct && (
                <Group justify="center" w="100%" gap="md">
                  <Button
                    size="md"
                    onClick={() => advanceRef.current(state)}
                    data-testid="next-question"
                  >
                    {state.lives <= 0 || state.index + 1 >= state.deck.length
                      ? 'See results'
                      : 'Next question'}
                  </Button>
                  {feedbackSecondsLeft !== null && feedbackSecondsLeft > 0 && (
                    <Text size="sm" c="dimmed">
                      Next in {feedbackSecondsLeft}s…
                    </Text>
                  )}
                </Group>
              )}
            </>
          )}
        </>
      )}

      {state.phase === 'gameover' && (
        <GameOverCard stats={gameOverStats(state)!} onRetry={handleRetry} />
      )}

      <FeedbackModal
        opened={reportOpen}
        onClose={() => setReportOpen(false)}
        questionId={question?.id ?? ''}
      />
    </Stack>
  );
}
