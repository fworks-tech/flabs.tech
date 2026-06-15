import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMousePosition } from "../useMousePosition";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMousePosition", () => {
  it("returns {x: 0, y: 0} initially", () => {
    const { result } = renderHook(() => useMousePosition());
    expect(result.current).toEqual({ x: 0, y: 0 });
  });

  it("updates when mouse moves", () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 150, clientY: 250 }));
    });

    expect(result.current).toEqual({ x: 150, y: 250 });
  });

  it("responds to multiple mouse moves", () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 10, clientY: 20 }));
    });
    expect(result.current).toEqual({ x: 10, y: 20 });

    act(() => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 999, clientY: 888 }));
    });
    expect(result.current).toEqual({ x: 999, y: 888 });
  });

  it("cleans up event listener on unmount", () => {
    const spy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useMousePosition());

    unmount();

    expect(spy).toHaveBeenCalledWith("mousemove", expect.any(Function));
  });
});
