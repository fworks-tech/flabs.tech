import { afterEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();

vi.mock("@vercel/analytics", () => ({ track }));

describe("analytics", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls track with event name and properties", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("cta_click", { label: "View Projects" });
    expect(track).toHaveBeenCalledWith("cta_click", { label: "View Projects" });
  });

  it("calls track with only event name", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    trackEvent("nav_click");
    expect(track).toHaveBeenCalledWith("nav_click", undefined);
  });

  it("does not throw in server environment", async () => {
    const spy = vi.spyOn(globalThis, "window", "get").mockReturnValue(undefined as unknown as Window & typeof globalThis);
    const { trackEvent } = await import("@/lib/analytics");
    expect(() => trackEvent("cta_click")).not.toThrow();
    expect(track).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
