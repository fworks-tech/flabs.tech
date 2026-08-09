"use client";

import { Stack } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AchievementToast } from "@/features/quiz/components/AchievementToast";
import { GameOverCard } from "@/features/quiz/components/GameOverCard";
import { QuizFeedbackBar } from "@/features/quiz/components/QuizFeedbackBar";
import { QuizQuestionCard } from "@/features/quiz/components/QuizQuestionCard";
import { QuizStartCard } from "@/features/quiz/components/QuizStartCard";
import { ScoreHud } from "@/features/quiz/components/ScoreHud";
import { buildDeck, dailyQuestion, type QuizQuestion } from "@/features/quiz/data/questions";
import {
  evaluateAchievements,
  useAchievements,
  type AchievementId,
} from "@/features/quiz/hooks/useAchievements";
import { useCountdown } from "@/features/quiz/hooks/useCountdown";
import { useHighScore } from "@/features/quiz/hooks/useHighScore";
import { gameOverStats, useQuizEngine } from "@/features/quiz/hooks/useQuizEngine";

const QUESTION_TIME_MS = 15000;
const FEEDBACK_PAUSE_MS = 1200;

/**
 * Owns the per-question countdown. Remounted with `key={question.id}` so
 * the timer re-arms for each question; reports the time taken with each
 * answer so the engine can score it.
 */
function QuestionStage({
  question,
  onAnswer,
  onTimeout,
}: {
  question: QuizQuestion;
  onAnswer: (index: number, timeMs: number) => void;
  onTimeout: () => void;
}) {
  const remaining = useCountdown(QUESTION_TIME_MS, true, onTimeout);
  return (
    <QuizQuestionCard
      question={question}
      remainingMs={remaining}
      durationMs={QUESTION_TIME_MS}
      selectedIndex={null}
      disabled={false}
      onAnswer={(index) => onAnswer(index, QUESTION_TIME_MS - remaining)}
    />
  );
}

export default function QuizPage() {
  const [state, dispatch] = useQuizEngine();
  const { bestScore, bestStreak, submitScore } = useHighScore();
  const { unlock } = useAchievements();
  const [newlyUnlocked, setNewlyUnlocked] = useState<AchievementId[]>([]);
  const daily = useMemo(() => dailyQuestion(), []);

  const handleTimeout = useCallback(() => dispatch({ type: "timeout" }), [dispatch]);

  const handleAnswer = useCallback(
    (index: number, timeMs: number) => {
      dispatch({ type: "answer", index, timeMs });
    },
    [dispatch],
  );

  useEffect(() => {
    if (state.phase !== "answered") return;
    const id = window.setTimeout(() => {
      const willEnd = state.lives <= 0 || state.index + 1 >= state.deck.length;
      if (willEnd) {
        const correctCount = state.answers.filter((a) => a.correct).length;
        submitScore(state.score, state.maxStreak);
        const timedAnswers = state.answers.filter((a) => a.timeMs > 0);
        const averageTimeMs =
          timedAnswers.length > 0
            ? timedAnswers.reduce((sum, a) => sum + a.timeMs, 0) / timedAnswers.length
            : 0;
        const fresh = unlock(
          evaluateAchievements({
            correctCount,
            total: state.deck.length,
            livesLeft: state.lives,
            averageTimeMs,
            completed: state.lives > 0,
          }),
        );
        if (fresh.length > 0) setNewlyUnlocked(fresh);
      }
      dispatch({ type: "advance", now: Date.now() });
    }, FEEDBACK_PAUSE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  const handleStart = useCallback(() => {
    dispatch({
      type: "start",
      deck: buildDeck(Math.floor(Math.random() * 2 ** 31)),
      now: Date.now(),
    });
  }, [dispatch]);

  const handleRetry = useCallback(() => {
    setNewlyUnlocked([]);
    dispatch({ type: "retry" });
  }, [dispatch]);

  const inQuestionFlow = state.phase === "running" || state.phase === "answered";
  const question =
    state.phase === "running" || state.phase === "answered" ? state.deck[state.index] : null;

  return (
    <Stack maw={820} pt="24" mx="auto" align="center" gap="md">
      <AchievementToast newlyUnlocked={newlyUnlocked} />

      {state.phase === "idle" && (
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
          {state.phase === "running" && (
            <QuestionStage
              key={question.id}
              question={question}
              onAnswer={handleAnswer}
              onTimeout={handleTimeout}
            />
          )}
          {state.phase === "answered" && (
            <>
              <QuizQuestionCard
                question={question}
                showTimer={false}
                remainingMs={0}
                durationMs={QUESTION_TIME_MS}
                selectedIndex={state.selectedIndex}
                disabled
                onAnswer={(index) => handleAnswer(index, 0)}
              />
              <QuizFeedbackBar
                correct={state.correct}
                timedOut={state.selectedIndex === -1}
                explanation={question.explanation}
                points={state.points}
              />
            </>
          )}
        </>
      )}

      {state.phase === "gameover" && (
        <GameOverCard stats={gameOverStats(state)!} onRetry={handleRetry} />
      )}
    </Stack>
  );
}
