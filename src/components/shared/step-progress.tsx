// PrintCardFlow — 6-step horizontal stepper.
"use client";

import * as React from "react";
import { Check, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { STEP_ORDER, STEP_LABELS, type WizardStep } from "@/lib/domain/types";
import { useWizardStore } from "@/lib/store/wizard-store";
import { cn } from "@/lib/utils";
import { useLowPowerMode } from "@/lib/performance-mode";

function stepState(
  idx: number,
  currentIdx: number,
  maxReached: number,
): "completed" | "current" | "reachable" | "locked" {
  if (idx < currentIdx) return "completed";
  if (idx === currentIdx) return "current";
  if (idx <= maxReached) return "reachable";
  return "locked";
}

export function StepProgress() {
  const step = useWizardStore((s) => s.step);
  const maxReached = useWizardStore((s) => s.maxReachedStep);
  const setStep = useWizardStore((s) => s.setStep);
  const lowPower = useLowPowerMode();

  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <nav aria-label="Шаги мастера" className="hidden md:block">
      <ol className="flex items-center gap-1">
        {STEP_ORDER.map((s, idx) => {
          const state = stepState(idx, currentIdx, maxReached);
          const locked = state === "locked";
          const isCurrent = state === "current";
          const isCompleted = state === "completed";
          const label = STEP_LABELS[s];
          return (
            <li key={s} className="flex items-center">
              <button
                type="button"
                disabled={locked}
                onClick={() => !locked && setStep(s as WizardStep)}
                className={cn(
                  "group relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-all pcf-focus",
                  isCurrent && "text-foreground",
                  !isCurrent && !locked && "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  locked && "text-muted-foreground/50 cursor-not-allowed",
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Шаг ${idx + 1}: ${label}${isCurrent ? " (текущий)" : isCompleted ? " (выполнен)" : locked ? " (недоступен)" : ""}`}
              >
                <span
                  className={cn(
                    "relative grid size-6 place-items-center rounded-full border text-[11px] font-semibold transition-all",
                    isCompleted && "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                    isCurrent && "border-foreground/40 bg-foreground/5 text-foreground",
                    state === "reachable" && "border-border bg-transparent text-muted-foreground group-hover:border-foreground/30",
                    locked && "border-border/50 bg-transparent",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : locked ? (
                    <Lock className="size-3" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                  {isCurrent && !lowPower && (
                    <motion.span
                      layoutId="step-current-ring"
                      className="absolute -inset-1 rounded-full ring-2 ring-foreground/30"
                      transition={{ duration: 0.25 }}
                    />
                  )}
                  {isCurrent && (
                    <motion.span
                      className="absolute -inset-1 rounded-full ring-2 ring-foreground/40"
                      animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.18, 1] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                </span>
                <span className="whitespace-nowrap font-medium">{label}</span>
              </button>
              {idx < STEP_ORDER.length - 1 && (
                <span
                  className={cn(
                    "pcf-step connector ml-1 h-px w-4 sm:w-6",
                    idx < currentIdx
                      ? "bg-emerald-500/40"
                      : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Compact mobile indicator. */
export function StepProgressMobile() {
  const step = useWizardStore((s) => s.step);
  const idx = STEP_ORDER.indexOf(step);
  return (
    <div className="md:hidden flex items-center gap-2 text-xs">
      <span className="font-semibold text-foreground">
        Шаг {idx + 1} из {STEP_ORDER.length}
      </span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground truncate max-w-[120px]">
        {STEP_LABELS[step]}
      </span>
    </div>
  );
}
