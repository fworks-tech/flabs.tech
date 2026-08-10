'use client';
import { useMousePosition } from '@/hooks/useMousePosition';
import React, { useRef, useEffect, useCallback } from 'react';

interface Circle {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tailLength: number;
  age: number;
  maxAge: number;
  fadeIn: number;
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  refresh?: boolean;
  comets?: boolean;
}

export default function Particles({
  className = '',
  quantity = 60,
  staticity = 50,
  ease = 50,
  refresh = false,
  comets = true,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<Circle[]>([]);
  const mousePosition = useMousePosition();
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const rafId = useRef<number>(0);
  const comet = useRef<Comet | null>(null);
  const cometTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFrame = useRef<number>(0);

  const resizeCanvas = useCallback(() => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  }, [dpr]);

  const circleParams = (): Circle => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const size = Math.floor(Math.random() * 2) + 0.1;
    const alpha = 0;
    const targetAlpha = Number.parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.2;
    const dy = (Math.random() - 0.5) * 0.2;
    const magnetism = 0.1 + Math.random() * 4;
    return { x, y, translateX, translateY, size, alpha, targetAlpha, dx, dy, magnetism };
  };

  /**
   * Spawns a comet entering from a random edge and crossing the canvas
   * diagonally toward the opposite half. Unlike the drifting dots it ignores
   * the mouse entirely — it is a brief, autonomous visitor.
   */
  const spawnComet = useCallback((): void => {
    const { w, h } = canvasSize.current;
    if (w === 0 || h === 0) return;

    const fromLeft = Math.random() < 0.5;
    const fromTop = Math.random() < 0.5;
    const x = fromLeft ? -24 : fromTop ? Math.random() * w : w + 24;
    const y = fromTop ? -24 : fromLeft ? Math.random() * h : h + 24;

    const targetX = fromLeft ? w * (0.6 + Math.random() * 0.4) : w * (0 - Math.random() * 0.4);
    const targetY = fromTop ? h * (0.6 + Math.random() * 0.4) : h * (0 - Math.random() * 0.4);

    const distance = Math.hypot(targetX - x, targetY - y);
    const maxAge = 2600 + Math.random() * 1400;
    const speed = distance / maxAge;
    comet.current = {
      x,
      y,
      vx: ((targetX - x) / distance) * speed,
      vy: ((targetY - y) / distance) * speed,
      tailLength: speed * 110,
      age: 0,
      maxAge,
      fadeIn: 220,
    };
  }, []);

  const drawComet = useCallback((c: Comet): void => {
    const ctx = context.current;
    if (!ctx) return;

    const fadeIn = Math.min(1, c.age / c.fadeIn);
    const fadeOut = Math.min(1, (c.maxAge - c.age) / 450);
    const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
    if (alpha <= 0) return;

    const speed = Math.hypot(c.vx, c.vy);
    const ux = c.vx / speed;
    const uy = c.vy / speed;
    const tailX = c.x - ux * c.tailLength;
    const tailY = c.y - uy * c.tailLength;

    const gradient = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * alpha})`);
    gradient.addColorStop(0.25, `rgba(190, 215, 255, ${0.4 * alpha})`);
    gradient.addColorStop(1, 'rgba(190, 215, 255, 0)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    ctx.fillStyle = `rgba(200, 225, 255, ${0.35 * alpha})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4.2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 1.8, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  const drawCircle = useCallback(
    (circle: Circle, update = false) => {
      if (context.current) {
        const { x, y, translateX, translateY, size, alpha } = circle;
        context.current.translate(translateX, translateY);
        context.current.beginPath();
        context.current.arc(x, y, size, 0, 2 * Math.PI);
        context.current.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.current.fill();
        context.current.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!update) {
          circles.current.push(circle);
        }
      }
    },
    [dpr],
  );

  const clearContext = useCallback(() => {
    if (context.current) {
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
    }
  }, []);

  const initCanvas = useCallback(() => {
    resizeCanvas();
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext('2d');
    }
    for (let i = 0; i < quantity; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  }, [quantity, drawCircle, resizeCanvas]);

  const remapValue = (
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ) => {
    const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  const animate = useCallback(
    function animateFrame(now: number) {
      clearContext();
      // Clamp the delta: rAF pauses when the tab is backgrounded, so the next
      // frame would otherwise advance the comet past its lifetime in one jump.
      const delta = Math.min(lastFrame.current > 0 ? now - lastFrame.current : 16.7, 100);
      lastFrame.current = now;

      circles.current.forEach((circle, i) => {
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSize.current.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.current.h - circle.y - circle.translateY - circle.size,
        ];
        const closestEdge = edge.reduce((a, b) => Math.min(a, b));
        const remapClosestEdge = Number.parseFloat(remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));
        if (remapClosestEdge > 1) {
          circle.alpha += 0.02;
          if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
        } else {
          circle.alpha = circle.targetAlpha * remapClosestEdge;
        }
        circle.x += circle.dx;
        circle.y += circle.dy;
        circle.translateX +=
          (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) / ease;
        circle.translateY +=
          (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) / ease;

        if (
          circle.x < -circle.size ||
          circle.x > canvasSize.current.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.current.h + circle.size
        ) {
          circles.current.splice(i, 1);
          const newCircle = circleParams();
          drawCircle(newCircle);
        } else {
          drawCircle(circle, true);
        }
      });

      // Comet paints last so it flies over the starfield.
      const activeComet = comet.current;
      if (activeComet) {
        activeComet.age += delta;
        activeComet.x += activeComet.vx * delta;
        activeComet.y += activeComet.vy * delta;
        if (activeComet.age >= activeComet.maxAge) {
          comet.current = null;
        } else {
          drawComet(activeComet);
        }
      }

      rafId.current = window.requestAnimationFrame(animateFrame);
    },
    [clearContext, staticity, ease, drawCircle, drawComet],
  );

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext('2d');
    }
    initCanvas();
    lastFrame.current = 0;
    rafId.current = window.requestAnimationFrame(animate);
    window.addEventListener('resize', initCanvas);
    return () => {
      window.cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', initCanvas);
    };
  }, [initCanvas, animate, refresh]);

  useEffect(() => {
    const element = canvasContainerRef.current;
    if (element) {
      const rect = element.getBoundingClientRect();
      mouse.current.x = mousePosition.x - rect.left;
      mouse.current.y = mousePosition.y - rect.top;
    }
  }, [mousePosition]);

  // Occasional surprise comet: flies across on its own schedule, regardless
  // of the mouse. Skipped while the user prefers reduced motion — and the
  // setting is watched live, so a mid-session toggle takes effect immediately.
  useEffect(() => {
    if (!comets) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    const schedule = (): void => {
      cometTimer.current = setTimeout(
        () => {
          spawnComet();
          schedule();
        },
        6000 + Math.random() * 14000,
      );
    };

    const sync = (): void => {
      if (cometTimer.current) clearTimeout(cometTimer.current);
      if (media.matches) {
        comet.current = null;
        return;
      }
      schedule();
    };

    sync();
    media.addEventListener('change', sync);
    return () => {
      if (cometTimer.current) clearTimeout(cometTimer.current);
      media.removeEventListener('change', sync);
    };
  }, [comets, spawnComet]);

  return (
    <div
      ref={canvasContainerRef}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
      className={className}
    >
      <canvas ref={canvasRef} aria-hidden="true" role="presentation" tabIndex={-1} />
    </div>
  );
}
