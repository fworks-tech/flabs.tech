import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { QuizQuestionCard } from "@/features/quiz/components/QuizQuestionCard";
import type { QuizQuestion } from "@/features/quiz/data/questions";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

const question: QuizQuestion = {
  id: "q1",
  category: "core",
  prompt: "What does `0 == false` evaluate to?",
  code: "0 == false",
  answers: ["true", "false", "TypeError", "null"],
  correctIndex: 0,
  explanation: "Loose equality coerces both sides to numbers.",
};

function renderCard(props: Partial<Parameters<typeof QuizQuestionCard>[0]> = {}) {
  return render(
    <QuizQuestionCard
      question={question}
      remainingMs={10000}
      durationMs={20000}
      selectedIndex={null}
      disabled={false}
      onAnswer={() => {}}
      {...props}
    />,
    { wrapper: Wrapper },
  );
}

describe("QuizQuestionCard", () => {
  it("renders the prompt, code block and four answers", () => {
    renderCard();
    expect(screen.getByText("What does `0 == false` evaluate to?")).toBeInTheDocument();
    expect(screen.getByTestId("question-code")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(4);
    expect(screen.getByTestId("answer-0")).toHaveTextContent("A.");
  });

  it("calls onAnswer with the clicked index", () => {
    const onAnswer = vi.fn();
    renderCard({ onAnswer });
    fireEvent.click(screen.getByTestId("answer-2"));
    expect(onAnswer).toHaveBeenCalledWith(2);
  });

  it("supports keyboard answers 1-4", () => {
    const onAnswer = vi.fn();
    renderCard({ onAnswer });
    fireEvent.keyDown(window, { key: "3" });
    expect(onAnswer).toHaveBeenCalledWith(2);
    fireEvent.keyDown(window, { key: "1" });
    expect(onAnswer).toHaveBeenCalledWith(0);
  });

  it("supports keyboard answers A-D", () => {
    const onAnswer = vi.fn();
    renderCard({ onAnswer });
    fireEvent.keyDown(window, { key: "d" });
    expect(onAnswer).toHaveBeenCalledWith(3);
  });

  it("ignores keyboard input when disabled", () => {
    const onAnswer = vi.fn();
    renderCard({ onAnswer, disabled: true });
    fireEvent.keyDown(window, { key: "2" });
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("blocks clicks when disabled", () => {
    const onAnswer = vi.fn();
    renderCard({ onAnswer, disabled: true });
    fireEvent.click(screen.getByTestId("answer-0"));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("marks the correct answer and the wrong pick after reveal", () => {
    renderCard({ selectedIndex: 2, disabled: true });
    expect(screen.getByTestId("answer-0")).toHaveAttribute("data-correct", "true");
    expect(screen.getByTestId("answer-2")).toHaveAttribute("data-wrong", "true");
  });

  it("announces the timer to screen readers", () => {
    renderCard();
    expect(screen.getByRole("timer")).toHaveAttribute("aria-label", "Time remaining: 10 seconds");
  });
});
