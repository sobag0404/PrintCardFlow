// PrintCardFlow — Root page (wires shell, step transitions, shortcuts).
"use client";

import * as React from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { AppHeader } from "@/components/shared/app-header";
import { AppFooter } from "@/components/shared/app-footer";
import { ToastStack } from "@/components/shared/toast-stack";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useWizardStore } from "@/lib/store/wizard-store";
import { STEP_ORDER, type WizardStep } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { useLowPowerMode } from "@/lib/performance-mode";

import { StepStart } from "@/components/wizard/step-start";
import { StepFolder } from "@/components/wizard/step-folder";
import { StepScan } from "@/components/wizard/step-scan";
import { StepPreset } from "@/components/wizard/step-preset";
import { StepPreview } from "@/components/wizard/step-preview";
import { StepExport } from "@/components/wizard/step-export";

const STEP_COMPONENTS: Record<WizardStep, React.ComponentType> = {
  start: StepStart,
  folder: StepFolder,
  scan: StepScan,
  preset: StepPreset,
  preview: StepPreview,
  export: StepExport,
};

export default function Home() {
  const step = useWizardStore((s) => s.step);
  const prevStepRef = React.useRef<WizardStep>(step);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const lowPower = useLowPowerMode();

  React.useEffect(() => {
    const prevIdx = STEP_ORDER.indexOf(prevStepRef.current);
    const nextIdx = STEP_ORDER.indexOf(step);
    setDirection(nextIdx >= prevIdx ? 1 : -1);
    prevStepRef.current = step;
  }, [step]);

  // Keyboard shortcuts — Ctrl+Z/Y/S/E/D and Esc are wired inside the hook.
  useKeyboardShortcuts({
    onEscape: () => {
      const s = useWizardStore.getState();
      // If a dialog is open, nothing to do here (Esc handled by hook itself).
      // Otherwise: clear selection on current step.
      if (s.arts.some((a) => a.selected)) {
        s.selectAll(false);
        s.pushToast({ variant: "default", title: "Снято выделение" });
      }
    },
    onDuplicate: () => {
      const s = useWizardStore.getState();
      const selected = s.arts.filter((a) => a.selected).map((a) => a.id);
      if (selected.length > 0) {
        s.duplicateArtsBulk(selected);
        s.pushToast({
          variant: "success",
          title: `Дублировано ${selected.length}`,
        });
      }
    },
  });

  const CurrentStep = STEP_COMPONENTS[step];

  // Direction-aware variants: forward → slide from right + blur in; back → from left.
  const variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 48 : -48,
      filter: "blur(8px)",
    }),
    center: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -48 : 48,
      filter: "blur(8px)",
    }),
  };

  return (
    <MotionConfig reducedMotion={lowPower ? "always" : "user"}>
    <div className="relative flex min-h-screen flex-col">
      {/* Aurora backdrop — fixed, low z-index, behind everything. */}
      <div
        aria-hidden
        className="pcf-aurora pointer-events-none fixed inset-0 -z-10 opacity-70"
      />

      <AppHeader />

      <main
        className="mx-auto flex w-full max-w-none flex-1 flex-col px-3 sm:px-6 2xl:px-10"
        aria-live="polite"
      >
        {lowPower ? (
          <div key={step} className={cn("flex flex-1 flex-col")}>
            <CurrentStep />
          </div>
        ) : (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={cn("flex flex-1 flex-col")}
            >
              <CurrentStep />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AppFooter />
      <ToastStack />
    </div>
    </MotionConfig>
  );
}
