import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@once-ui-system/core");
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/work"),
}));

vi.mock("@/config", () => ({
  routes: { "/": true, "/work": true, "/blog": true },
  protectedRoutes: {},
}));

vi.mock("@/app/not-found", () => ({
  default: () => <div>Not Found</div>,
}));

import { RouteGuard } from "@/components/layout/RouteGuard";

describe("RouteGuard", () => {
  it("renders children for allowed route", async () => {
    render(
      <RouteGuard>
        <div data-testid="child">Protected Content</div>
      </RouteGuard>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  it("shows not-found for disabled route", async () => {
    vi.mocked(
      (await import("next/navigation")).usePathname as ReturnType<typeof vi.fn>,
    ).mockReturnValue("/nonexistent");
    render(
      <RouteGuard>
        <div data-testid="child">Content</div>
      </RouteGuard>,
    );
    await waitFor(() => {
      expect(screen.getByText("Not Found")).toBeInTheDocument();
    });
  });
});
