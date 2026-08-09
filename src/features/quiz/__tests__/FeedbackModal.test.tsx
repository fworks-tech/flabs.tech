import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedbackModal } from "@/features/quiz/components/FeedbackModal";

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MantineProvider>
      <Notifications position="top-right" autoClose={3000} />
      {children}
    </MantineProvider>
  );
}

describe("FeedbackModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits the chosen reason and message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const onClose = vi.fn();
    render(
      <FeedbackModal opened questionId="event-loop-order" onClose={onClose} />,
      { wrapper: Wrapper },
    );

    await user.click(screen.getByLabelText("typo"));
    await user.type(screen.getByTestId("feedback-message"), "missing semicolon");
    await user.click(screen.getByTestId("feedback-submit"));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quiz/feedback",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          questionId: "event-loop-order",
          reason: "typo",
          message: "missing semicolon",
        }),
      }),
    );
    await screen.findByText("Thanks — we'll review it");
    expect(onClose).toHaveBeenCalled();
  });

  it("disables submit until a reason is chosen", async () => {
    render(<FeedbackModal opened questionId="q1" onClose={vi.fn()} />, {
      wrapper: Wrapper,
    });
    expect(screen.getByTestId("feedback-submit")).toBeDisabled();
  });

  it("shows a failure toast when the API rejects", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );
    render(<FeedbackModal opened questionId="q1" onClose={vi.fn()} />, {
      wrapper: Wrapper,
    });

    await user.click(screen.getByLabelText("unclear"));
    await user.click(screen.getByTestId("feedback-submit"));

    expect(
      await screen.findByText("Couldn't send feedback right now"),
    ).toBeInTheDocument();
  });
});
