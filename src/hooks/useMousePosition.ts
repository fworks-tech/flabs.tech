'use client';
import { useEffect, useState } from 'react';

export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    const updateTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) setMousePosition({ x: touch.clientX, y: touch.clientY });
    };

    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('touchstart', updateTouch, { passive: true });
    window.addEventListener('touchmove', updateTouch, { passive: true });

    return () => {
      window.removeEventListener('mousemove', updateMouse);
      window.removeEventListener('touchstart', updateTouch);
      window.removeEventListener('touchmove', updateTouch);
    };
  }, []);

  return mousePosition;
}
