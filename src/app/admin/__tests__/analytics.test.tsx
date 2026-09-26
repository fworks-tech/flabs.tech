import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const trackingStoreMock = vi.hoisted(() => ({
  getDaySeries: vi.fn(),
  getTotals: vi.fn(),
  getTopPages: vi.fn(),
  getRecentEvents: vi.fn(),
  getEngagement: vi.fn(),
}));

const storeMock = vi.hoisted(() => ({ storageBackend: "memory" as "redis" | "memory" }));

vi.mock("@/lib/tracking-store", () => trackingStoreMock);
vi.mock("@/lib/abuse/store", () => storeMock);

vi.mock("@/components/admin/AdminCharts", () => ({
  TrafficChart: () => <div data-testid="traffic-chart" />,
  TopPagesChart: () => <div data-testid="top-pages-chart" />,
  DevicePie: () => <div data-testid="device-pie" />,
  FunnelChart: ({ data }: { data: { stage: string; value: number }[] }) => (
    <div data-testid="funnel-chart">{data.map((d) => `${d.stage}:${d.value}`).join(",")}</div>
  ),
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

beforeEach(() => {
  trackingStoreMock.getDaySeries.mockResolvedValue([
    { day: "2026-08-03", pageviews: 10, sessions: 4, uniques: 3, clicks: 2, chatMessages: 1 },
    { day: "2026-08-04", pageviews: 20, sessions: 6, uniques: 5, clicks: 4, chatMessages: 2 },
  ]);
  trackingStoreMock.getTotals.mockResolvedValue({
    pageviews: 30,
    sessions: 10,
    uniques: 8,
    newVisitors: 6,
    returningVisitors: 2,
    clicks: 6,
    devices: { mobile: 9, desktop: 4 },
    browsers: { chrome: 10 },
  });
  trackingStoreMock.getTopPages.mockResolvedValue([
    ["/", 15],
    ["/blog", 9],
  ]);
  trackingStoreMock.getRecentEvents.mockResolvedValue([
    { t: Date.now(), ty: "page_view", p: "/blog", d: "mobile", b: "chrome" },
  ]);
  trackingStoreMock.getEngagement.mockResolvedValue({
    browsers: { chrome: 10, safari: 4 },
    scrollDepth: { 25: 8, 50: 6, 75: 4, 100: 2 },
    quiz: { starts: 5, completes: 3 },
  });
});

describe("admin analytics page", () => {
  it("renders totals, charts and recent events", async () => {
    const { default: Page } = await import("@/app/admin/analytics/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByTestId("traffic-chart")).toBeInTheDocument();
    expect(screen.getByTestId("top-pages-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("device-pie")).toHaveLength(2);
    expect(screen.getByText("page_view")).toBeInTheDocument();
  });

  it("surfaces the browser split, scroll funnel and quiz funnel", async () => {
    const { default: Page } = await import("@/app/admin/analytics/page");
    render(await Page(), { wrapper: Wrapper });

    expect(screen.getByText("Browsers (7d)")).toBeInTheDocument();
    expect(screen.getByText("Scroll depth (7d)")).toBeInTheDocument();

    const funnels = screen.getAllByTestId("funnel-chart").map((el) => el.textContent);
    expect(funnels).toContain("25%:8,50%:6,75%:4,100%:2");
    expect(funnels).toContain("Started:5,Completed:3");
  });

  it("shows the storage backend badge", async () => {
    const { default: Page } = await import("@/app/admin/analytics/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    const badge = screen.getByTestId("analytics-backend-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("In-memory (resets on cold start)");
  });

  it("shows an empty state without recent events", async () => {
    trackingStoreMock.getRecentEvents.mockResolvedValue([]);

    const { default: Page } = await import("@/app/admin/analytics/page");
    const view = await Page();
    render(view, { wrapper: Wrapper });

    expect(screen.getByText(/No events recorded yet/)).toBeInTheDocument();
  });
});
