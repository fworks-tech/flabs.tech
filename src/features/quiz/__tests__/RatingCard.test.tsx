import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RatingCard } from "@/features/quiz/components/RatingCard";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

describe("RatingCard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a recommendation with an optional comment", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const onSubmitted = vi.fn();
    render(<RatingCard onSubmitted={onSubmitted} />, { wrapper: Wrapper });

    await user.click(screen.getByTestId("rating-up"));
    await user.type(screen.getByTestId("rating-comment"), "fun quiz");
    await user.click(screen.getByTestId("rating-submit"));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quiz/rating",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rating: 1, comment: "fun quiz" }),
      }),
    );
    expect(await screen.findByTestId("rating-thanks")).toBeInTheDocument();
    expect(onSubmitted).toHaveBeenCalled();
  });

  it("disables submit until a thumb is chosen", () => {
    render(<RatingCard onSubmitted={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.getByTestId("rating-submit")).toBeDisabled();
  });

  it("shows a quiet failure message on API error", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));
    render(<RatingCard onSubmitted={vi.fn()} />, { wrapper: Wrapper });

    await user.click(screen.getByTestId("rating-down"));
    await user.click(screen.getByTestId("rating-submit"));

    expect(await screen.findByTestId("rating-failed")).toBeInTheDocument();
  });
});
