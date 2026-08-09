import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "@/features/quiz/hooks/useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at the full duration and counts down", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useCountdown(20000, true, onTimeout));

    expect(result.current).toBe(20000);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(15000);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("calls onTimeout exactly once when reaching zero", () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() => useCountdown(20000, true, onTimeout));

    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(result.current).toBe(0);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("re-arms when remounted (per-question key pattern)", () => {
    const onTimeout = vi.fn();
    const first = renderHook(() => useCountdown(20000, true, onTimeout));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(first.result.current).toBe(15000);
    first.unmount();

    const second = renderHook(() => useCountdown(20000, true, onTimeout));
    expect(second.result.current).toBe(20000);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("does not run timers while inactive", () => {
    const onTimeout = vi.fn();
    const { result, rerender } = renderHook(
      ({ active }) => useCountdown(20000, active, onTimeout),
      { initialProps: { active: false } },
    );

    expect(result.current).toBe(20000);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(onTimeout).not.toHaveBeenCalled();

    rerender({ active: true });
    expect(result.current).toBe(20000);
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("cleans up the interval on unmount", () => {
    const onTimeout = vi.fn();
    const { unmount } = renderHook(() => useCountdown(20000, true, onTimeout));

    unmount();
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(onTimeout).not.toHaveBeenCalled();
  });
});
