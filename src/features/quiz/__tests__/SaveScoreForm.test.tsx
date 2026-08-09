import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SaveScoreForm } from "@/features/quiz/components/SaveScoreForm";
import type { ScorePayload } from "@/features/quiz/lib/leaderboard";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

const baseProps = {
  defaultName: "Zara",
  score: 3400,
  correct: 17,
  total: 20,
  maxStreak: 9,
  durationMs: 180_000,
  onNameChange: vi.fn(),
  onSave: vi.fn(async () => 0),
};

describe("SaveScoreForm", () => {
  it("prefills the name from localStorage-backed default", () => {
    render(<SaveScoreForm {...baseProps} />, { wrapper: Wrapper });
    expect(screen.getByLabelText("Display name")).toHaveValue("Zara");
  });

  it("disables the button with an empty name", () => {
    render(<SaveScoreForm {...baseProps} defaultName="" />, { wrapper: Wrapper });
    expect(screen.getByTestId("save-score")).toBeDisabled();
  });

  it("submits the payload and shows the rank", async () => {
    const user = userEvent.setup();
    render(<SaveScoreForm {...baseProps} />, { wrapper: Wrapper });

    await user.click(screen.getByTestId("save-score"));

    expect(baseProps.onSave).toHaveBeenCalledWith<[ScorePayload]>(
      expect.objectContaining({
        displayName: "Zara",
        score: 3400,
        correct: 17,
        total: 20,
        maxStreak: 9,
        durationMs: 180_000,
      }),
    );
    expect(await screen.findByTestId("save-rank")).toHaveTextContent("You're #1");
  });

  it("persists the typed name via onNameChange", async () => {
    const user = userEvent.setup();
    render(<SaveScoreForm {...baseProps} defaultName="" />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText("Display name"), "Newbie");
    await user.click(screen.getByTestId("save-score"));

    expect(baseProps.onNameChange).toHaveBeenCalledWith("Newbie");
  });

  it("shows a quiet failure message when saving fails", async () => {
    const user = userEvent.setup();
    render(<SaveScoreForm {...baseProps} onSave={vi.fn(async () => null)} />, {
      wrapper: Wrapper,
    });

    await user.click(screen.getByTestId("save-score"));

    expect(await screen.findByTestId("save-failed")).toBeInTheDocument();
    expect(screen.queryByTestId("save-rank")).not.toBeInTheDocument();
  });
});
