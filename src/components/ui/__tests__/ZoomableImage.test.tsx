import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ZoomableImage } from "@/components/ui/ZoomableImage";

function Wrapper({ children }: { children: ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

function mockViewportRect(el: HTMLElement, width: number, height: number) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
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

describe("ZoomableImage", () => {
  it("renders the image unzoomed by default", () => {
    render(<ZoomableImage src="/images/test.webp" alt="Test image" />, { wrapper: Wrapper });
    expect(screen.getByAltText("Test image")).toHaveStyle({ transform: "scale(1)" });
  });

  it("zooms toward the cursor position on mouse move", () => {
    render(<ZoomableImage src="/images/test.webp" alt="Test image" />, {
      wrapper: Wrapper,
    });
    const viewport = screen.getByAltText("Test image").parentElement as HTMLElement;
    mockViewportRect(viewport, 200, 100);

    fireEvent.mouseMove(viewport, { clientX: 50, clientY: 25 });

    const img = screen.getByAltText("Test image");
    expect(img).toHaveStyle({ transform: "scale(2)" });
    expect(img.style.transformOrigin).toBe("25.0% 25.0%");
  });

  it("resets the zoom on mouse leave", () => {
    render(<ZoomableImage src="/images/test.webp" alt="Test image" />, {
      wrapper: Wrapper,
    });
    const viewport = screen.getByAltText("Test image").parentElement as HTMLElement;
    mockViewportRect(viewport, 200, 100);

    fireEvent.mouseMove(viewport, { clientX: 50, clientY: 25 });
    expect(screen.getByAltText("Test image")).toHaveStyle({ transform: "scale(2)" });

    fireEvent.mouseLeave(viewport);
    expect(screen.getByAltText("Test image")).toHaveStyle({ transform: "scale(1)" });
  });
});
