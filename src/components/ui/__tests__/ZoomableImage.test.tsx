import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { ZoomableImage } from '@/components/ui/ZoomableImage';

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

function mockViewportRect(el: HTMLElement, width: number, height: number) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => {},
  } as DOMRect);
}

// Mantine Image renders a bare <img>, so its parent is the viewport div that
// owns onMouseMove/onMouseLeave. (container.firstChild is not the viewport:
// Emotion injects <style> nodes ahead of it under MantineProvider.)
function getViewport(alt: string) {
  return screen.getByAltText(alt).parentElement as HTMLElement;
}

describe('ZoomableImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the image unzoomed by default', () => {
    render(<ZoomableImage src="/images/test.webp" alt="Test image" />, { wrapper: Wrapper });
    expect(screen.getByAltText('Test image')).toHaveStyle({ transform: 'scale(1)' });
  });

  it('defaults to an empty alt for decorative images', () => {
    const { container } = render(<ZoomableImage src="/images/test.webp" />, { wrapper: Wrapper });
    // Empty alt exposes presentation role, so query the element directly.
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('zooms toward the cursor position on mouse move', () => {
    render(<ZoomableImage src="/images/test.webp" alt="Test image" />, {
      wrapper: Wrapper,
    });
    const viewport = getViewport('Test image');
    mockViewportRect(viewport, 200, 100);

    fireEvent.mouseMove(viewport, { clientX: 50, clientY: 25 });

    const img = screen.getByAltText('Test image');
    expect(img).toHaveStyle({ transform: 'scale(2)' });
    expect(img).toHaveStyle({ transformOrigin: '25.0% 25.0%' });
  });

  it('stays unzoomed when the viewport has no measurable size', () => {
    render(<ZoomableImage src="/images/test.webp" alt="Test image" />, {
      wrapper: Wrapper,
    });
    const viewport = getViewport('Test image');
    mockViewportRect(viewport, 0, 100);

    fireEvent.mouseMove(viewport, { clientX: 50, clientY: 25 });

    expect(screen.getByAltText('Test image')).toHaveStyle({ transform: 'scale(1)' });
  });

  it('resets the zoom on mouse leave', () => {
    render(<ZoomableImage src="/images/test.webp" alt="Test image" />, {
      wrapper: Wrapper,
    });
    const viewport = getViewport('Test image');
    mockViewportRect(viewport, 200, 100);

    fireEvent.mouseMove(viewport, { clientX: 50, clientY: 25 });
    expect(screen.getByAltText('Test image')).toHaveStyle({ transform: 'scale(2)' });

    fireEvent.mouseLeave(viewport);
    expect(screen.getByAltText('Test image')).toHaveStyle({ transform: 'scale(1)' });
  });

  it('forwards extra img attributes to the image', () => {
    render(<ZoomableImage src="/images/test.webp" alt="Test image" title="Figure caption" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByAltText('Test image')).toHaveAttribute('title', 'Figure caption');
  });
});
