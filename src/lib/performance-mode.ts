"use client";

import * as React from "react";

export type PerformanceMode = "balanced" | "low-power";

export function getPerformanceMode(): PerformanceMode {
  if (typeof window === "undefined") return "balanced";
  return window.electronAPI?.performanceMode === "low-power" ? "low-power" : "balanced";
}

export function isLowPowerMode(): boolean {
  if (typeof window === "undefined") return false;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  return reducedMotion || getPerformanceMode() === "low-power";
}

export function useLowPowerMode(): boolean {
  const [lowPower, setLowPower] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setLowPower(isLowPowerMode());
    update();
    media?.addEventListener?.("change", update);
    return () => media?.removeEventListener?.("change", update);
  }, []);

  return lowPower;
}
