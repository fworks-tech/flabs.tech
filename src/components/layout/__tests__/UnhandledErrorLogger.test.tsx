import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const errorFn = vi.fn();

vi.mock("@/lib/logger", () => ({
  logger: { error: errorFn },
}));

describe("UnhandledErrorLogger", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders null", async () => {
    const { UnhandledErrorLogger } = await import("@/components/layout/UnhandledErrorLogger");
    const { container } = render(<UnhandledErrorLogger />);
    expect(container.firstChild).toBeNull();
  });

  it("registers error event listeners on mount", async () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    const { UnhandledErrorLogger } = await import("@/components/layout/UnhandledErrorLogger");
    render(<UnhandledErrorLogger />);
    expect(addEventListenerSpy).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith("error", expect.any(Function));
    addEventListenerSpy.mockRestore();
  });

  it("logs unhandled promise rejections", async () => {
    const { UnhandledErrorLogger } = await import("@/components/layout/UnhandledErrorLogger");
    render(<UnhandledErrorLogger />);
    const reason = new Error("async error");
    const event = new PromiseRejectionEvent("unhandledrejection", {
      reason,
      promise: Promise.resolve(),
    });
    window.dispatchEvent(event);
    expect(errorFn).toHaveBeenCalledWith(reason, "unhandled promise rejection");
  });

  it("logs uncaught errors", async () => {
    const { UnhandledErrorLogger } = await import("@/components/layout/UnhandledErrorLogger");
    render(<UnhandledErrorLogger />);
    const event = new ErrorEvent("error", {
      error: new Error("sync error"),
      message: "sync error",
    });
    window.dispatchEvent(event);
    expect(errorFn).toHaveBeenCalledWith(expect.any(Error), "uncaught error");
  });

  it("removes event listeners on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { UnhandledErrorLogger } = await import("@/components/layout/UnhandledErrorLogger");
    const { unmount } = render(<UnhandledErrorLogger />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith("unhandledrejection", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("error", expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });
});
