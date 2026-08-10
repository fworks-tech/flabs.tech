import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMousePosition } from '../useMousePosition';

function touchEvent(
  type: 'touchstart' | 'touchmove',
  touches: Array<{ clientX: number; clientY: number }>,
): Event {
  const event = new Event(type);
  Object.defineProperty(event, 'touches', { value: touches });
  return event;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMousePosition', () => {
  it('returns {x: 0, y: 0} initially', () => {
    const { result } = renderHook(() => useMousePosition());
    expect(result.current).toEqual({ x: 0, y: 0 });
  });

  it('updates when mouse moves', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 250 }));
    });

    expect(result.current).toEqual({ x: 150, y: 250 });
  });

  it('responds to multiple mouse moves', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 10, clientY: 20 }));
    });
    expect(result.current).toEqual({ x: 10, y: 20 });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 999, clientY: 888 }));
    });
    expect(result.current).toEqual({ x: 999, y: 888 });
  });

  it('updates from the first touch on touchstart', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      window.dispatchEvent(touchEvent('touchstart', [{ clientX: 300, clientY: 400 }]));
    });

    expect(result.current).toEqual({ x: 300, y: 400 });
  });

  it('follows the finger on touchmove', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      window.dispatchEvent(touchEvent('touchmove', [{ clientX: 120, clientY: 240 }]));
    });

    expect(result.current).toEqual({ x: 120, y: 240 });
  });

  it('ignores touch events with no active touches', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      window.dispatchEvent(touchEvent('touchstart', [{ clientX: 300, clientY: 400 }]));
    });
    act(() => {
      window.dispatchEvent(touchEvent('touchmove', []));
    });

    expect(result.current).toEqual({ x: 300, y: 400 });
  });

  it('registers touch listeners as passive so scrolling is never blocked', () => {
    const spy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useMousePosition());

    const touchstartCall = spy.mock.calls.find(([type]) => type === 'touchstart');
    const touchmoveCall = spy.mock.calls.find(([type]) => type === 'touchmove');

    expect(touchstartCall?.[2]).toEqual({ passive: true });
    expect(touchmoveCall?.[2]).toEqual({ passive: true });
  });

  it('cleans up all event listeners on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useMousePosition());

    unmount();

    expect(spy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(spy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(spy).toHaveBeenCalledWith('touchmove', expect.any(Function));
  });
});
