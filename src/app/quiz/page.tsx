"use client";

import { Stack } from "@mantine/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AchievementToast } from "@/features/quiz/components/AchievementToast";
import { FeedbackModal } from "@/features/quiz/components/FeedbackModal";
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
import { trackEvent } from "@/lib/analytics";
import { gameOverStats, useQuizEngine, type EngineState } from "@/features/quiz/hooks/useQuizEngine";

const QUESTION_TIME_MS = 15000;
const FEEDBACK_PAUSE_MS = 1200;

/**
 * Best-effort attempt log via sendBeacon (fires once per finished game;
 * the browser flushes it even when the tab closes).
 */
function sendAttemptBeacon(state: Extract<EngineState, { phase: "answered" }>) {
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
    navigator.sendBeacon("/api/quiz/attempt", new Blob([JSON.stringify(payload)], {
      type: "application/json",
    }));
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
  onAnswer,
  onTimeout,
  onReport,
}: {
  question: QuizQuestion;
  onAnswer: (index: number, timeMs: number) => void;
  onTimeout: () => void;
  onReport: () => void;
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
  const daily = useMemo(() => dailyQuestion(), []);

  const handleReport = useCallback(() => setReportOpen(true), []);

  const handleTimeout = useCallback(() => dispatch({ type: "timeout" }), [dispatch]);

  const currentQuestion = state.phase === "running" || state.phase === "answered"
    ? state.deck[state.index]
    : null;
  const currentStreak = state.phase === "running" || state.phase === "answered"
    ? state.streak
    : 0;

  const handleAnswer = useCallback(
    (index: number, timeMs: number) => {
      dispatch({ type: "answer", index, timeMs });
      if (currentQuestion) {
        trackEvent("quiz_answer", {
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
        sendAttemptBeacon(state);
        trackEvent("quiz_complete", {
          score: state.score,
          accuracy: state.deck.length === 0 ? 0 : correctCount / state.deck.length,
          maxStreak: state.maxStreak,
          livesLeft: state.lives,
          durationMs: Date.now() - state.startedAt,
          rankTitle: (() => {
            const acc = state.deck.length === 0 ? 0 : correctCount / state.deck.length;
            if (acc >= 0.9) return "Staff";
            if (acc >= 0.75) return "Senior";
            if (acc >= 0.6) return "Mid-Level";
            return "Junior";
          })(),
        });
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
              onReport={handleReport}
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
                onReport={handleReport}
              />
              <QuizFeedbackBar
                correct={state.correct}
                timedOut={state.selectedIndex === -1}
                explanation={question.explanation}
                points={state.points}
                onReport={handleReport}
              />
            </>
          )}
        </>
      )}

      {state.phase === "gameover" && (
        <GameOverCard stats={gameOverStats(state)!} onRetry={handleRetry} />
      )}

      <FeedbackModal
        opened={reportOpen}
        onClose={() => setReportOpen(false)}
        questionId={question?.id ?? ""}
      />
    </Stack>
  );
}
