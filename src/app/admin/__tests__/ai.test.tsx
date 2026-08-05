import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const aiStatsMock = vi.hoisted(() => ({
  getAiDaySeries: vi.fn(),
  getAiTotals: vi.fn(),
  getRecentAiEvents: vi.fn(),
  getAbuseOverview: vi.fn(),
}));

vi.mock("@/lib/ai-stats", () => aiStatsMock);

vi.mock("@/components/admin/AiCharts", () => ({
  AiRequestsChart: () => <div data-testid="ai-requests-chart" />,
  AiTokensChart: () => <div data-testid="ai-tokens-chart" />,
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

beforeEach(() => {
  aiStatsMock.getAiDaySeries.mockResolvedValue([
    { day: "2026-08-04", requests: 5, tokensIn: 900, tokensOut: 300, blocked: 1, injection: 0 },
  ]);
  aiStatsMock.getAiTotals.mockResolvedValue({
    requests: 12,
    tokensIn: 2400,
    tokensOut: 800,
    blocked: 2,
    injection: 3,
  });
  aiStatsMock.getRecentAiEvents.mockResolvedValue([
    {
      t: Date.now(),
      model: "mimo-v2.5",
      tokensIn: 100,
      tokensOut: 50,
      tier: "throttle",
      blocked: true,
      injection: false,
    },
  ]);
  aiStatsMock.getAbuseOverview.mockResolvedValue({
    cases: [{ key: "actor-1", kind: "injection", detail: "prompt injection pattern" }],
    quarantines: ["actor-1"],
  });
});

describe("admin AI page", () => {
  it("renders usage stats, charts and abuse state", async () => {
    const { default: Page } = await import("@/app/admin/ai/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2.4k")).toBeInTheDocument();
    expect(screen.getByText("800")).toBeInTheDocument();
    expect(screen.getByTestId("ai-requests-chart")).toBeInTheDocument();
    expect(screen.getByTestId("ai-tokens-chart")).toBeInTheDocument();
    expect(screen.getByText("blocked")).toBeInTheDocument();
    expect(screen.getAllByText("actor-1")).toHaveLength(2);
  });

  it("shows empty states when there is no data", async () => {
    aiStatsMock.getRecentAiEvents.mockResolvedValue([]);
    aiStatsMock.getAbuseOverview.mockResolvedValue({ cases: [], quarantines: [] });

    const { default: Page } = await import("@/app/admin/ai/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    expect(screen.getByText(/No requests recorded yet/)).toBeInTheDocument();
    expect(screen.getByText("No open cases.")).toBeInTheDocument();
    expect(screen.getByText("Nothing quarantined.")).toBeInTheDocument();
  });
});
