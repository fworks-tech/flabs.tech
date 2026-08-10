import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { DailyQuestionCard } from '@/features/quiz/components/DailyQuestionCard';
import type { QuizQuestion } from '@/features/quiz/data/questions';
import { resetDailyStoreForTests } from '@/features/quiz/hooks/useDailyHistory';
import { saveDailyAttempt, shiftDate, todayKey } from '@/features/quiz/lib/daily';

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

const question: QuizQuestion = {
  id: 'daily-test',
  category: 'core',
  prompt: 'Which declaration is hoisted AND initialized to undefined?',
  code: 'var x = 1;',
  answers: ['var', 'let', 'const', 'None of them'],
  correctIndex: 0,
  explanation: 'var is hoisted and initialized to undefined.',
  explanationCode: 'console.log(a); // undefined',
};

function renderCard() {
  return render(<DailyQuestionCard question={question} />, { wrapper: Wrapper });
}

afterEach(() => {
  window.localStorage.clear();
  resetDailyStoreForTests();
});

describe('DailyQuestionCard', () => {
  it('renders the prompt, code block and four answers', () => {
    renderCard();
    expect(screen.getByText(question.prompt)).toBeInTheDocument();
    expect(screen.getByTestId('daily-question-code')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('shows Correct feedback with the explanation on a right answer', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('daily-answer-0'));
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
    expect(screen.getByText(question.explanation)).toBeInTheDocument();
    expect(screen.queryByTestId('explanation-code')).not.toBeInTheDocument();
  });

  it('shows the learning code snippet on a wrong answer', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('daily-answer-2'));
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    expect(screen.getByTestId('explanation-code')).toHaveTextContent('undefined');
    expect(screen.getByTestId('daily-answer-0')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByTestId('daily-answer-2')).toHaveAttribute('data-wrong', 'true');
  });

  it('accepts keyboard answers 1-4 and A-D', () => {
    renderCard();
    fireEvent.keyDown(window, { key: '2' });
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
  });

  it('ignores further answers once answered', () => {
    renderCard();
    fireEvent.click(screen.getByTestId('daily-answer-0'));
    fireEvent.click(screen.getByTestId('daily-answer-1'));
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
  });

  it('locks after answering — a remount shows the stored result', () => {
    const { unmount } = renderCard();
    fireEvent.click(screen.getByTestId('daily-answer-0'));
    unmount();

    renderCard();
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
    expect(screen.getByTestId('daily-answer-0')).toHaveAttribute('data-correct', 'true');
  });

  it('shows the streak when yesterday was answered correctly', () => {
    saveDailyAttempt({
      date: shiftDate(todayKey(), -1),
      questionId: 'yesterday',
      selectedIndex: 0,
      correct: true,
    });
    renderCard();
    fireEvent.click(screen.getByTestId('daily-answer-0'));
    expect(screen.getByTestId('daily-streak')).toHaveTextContent('2-day streak');
  });

  it('shows no streak with no history', () => {
    renderCard();
    expect(screen.queryByTestId('daily-streak')).not.toBeInTheDocument();
  });
});
