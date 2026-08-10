import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { QuizFeedbackBar } from '@/features/quiz/components/QuizFeedbackBar';

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

function renderBar(props: Partial<Parameters<typeof QuizFeedbackBar>[0]> = {}) {
  return render(
    <QuizFeedbackBar
      correct={false}
      timedOut={false}
      explanation="Loose equality coerces both sides."
      explanationCode="0 == false; // true"
      points={100}
      {...props}
    />,
    { wrapper: Wrapper },
  );
}

describe('QuizFeedbackBar', () => {
  it('shows the explanation text', () => {
    renderBar();
    expect(screen.getByText('Loose equality coerces both sides.')).toBeInTheDocument();
  });

  it('shows the code snippet when the answer is wrong', () => {
    renderBar({ correct: false });
    expect(screen.getByTestId('explanation-code')).toHaveTextContent('0 == false');
  });

  it('shows the code snippet on timeouts', () => {
    renderBar({ correct: false, timedOut: true });
    expect(screen.getByTestId('explanation-code')).toBeInTheDocument();
  });

  it('hides the code snippet when the answer is correct', () => {
    renderBar({ correct: true });
    expect(screen.queryByTestId('explanation-code')).not.toBeInTheDocument();
  });

  it('hides the points flyout when points are omitted', () => {
    renderBar({ correct: true, points: undefined });
    expect(screen.getByText(/Correct!/)).toBeInTheDocument();
    expect(screen.queryByText(/pts/)).not.toBeInTheDocument();
  });

  it('renders without a code snippet when none is provided', () => {
    renderBar({ correct: false, explanationCode: undefined });
    expect(screen.queryByTestId('explanation-code')).not.toBeInTheDocument();
  });

  it('announces the result to screen readers', () => {
    renderBar({ correct: false });
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
