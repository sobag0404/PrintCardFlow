// PrintCardFlow — Animated number (count-up via useCountUp hook).
"use client";

import * as React from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function useCountUp(value: number, duration = 600): number {
  const [display, setDisplay] = React.useState(value);
  const fromRef = React.useRef(value);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (prefersReducedMotion()) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplay(value);
        fromRef.current = value;
      });
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      rafRef.current = requestAnimationFrame(() => setDisplay(to));
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return display;
}

export interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 600,
  className,
  format,
}: AnimatedNumberProps) {
  const display = useCountUp(value, duration);
  const text = format ? format(display) : String(display);
  return <span className={className}>{text}</span>;
}
