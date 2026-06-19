// PrintCardFlow — Wizard footer navigation (Назад / Далее).
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/shared/loading-button";
import { useWizardStore } from "@/lib/store/wizard-store";
import { cn } from "@/lib/utils";

export interface WizardFooterNavProps {
  nextLabel?: string;
  prevLabel?: string;
  onNext?: () => void | Promise<void>;
  onPrev?: () => void;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  nextLoadingText?: string;
  /** Optional custom right-side actions rendered before Далее. */
  rightExtra?: React.ReactNode;
  className?: string;
}

export function WizardFooterNav({
  nextLabel = "Далее",
  prevLabel = "Назад",
  onNext,
  onPrev,
  nextDisabled,
  nextLoading,
  nextLoadingText,
  rightExtra,
  className,
}: WizardFooterNavProps) {
  const canNext = useWizardStore((s) => s.canNext());
  const canPrev = useWizardStore((s) => s.canPrev());
  const next = useWizardStore((s) => s.next);
  const prev = useWizardStore((s) => s.prev);

  const handleNext = async () => {
    if (onNext) {
      await onNext();
    } else {
      next();
    }
  };
  const handlePrev = () => {
    if (onPrev) onPrev();
    else prev();
  };

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <Button
        variant="outline"
        onClick={handlePrev}
        disabled={!canPrev}
        className="pcf-focus"
      >
        <ArrowLeft className="size-4" />
        {prevLabel}
      </Button>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
        {rightExtra}
        <LoadingButton
          onClick={handleNext}
          disabled={nextDisabled || (!onNext && !canNext)}
          loading={nextLoading}
          loadingText={nextLoadingText}
          className="pcf-focus bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 text-white hover:opacity-90"
        >
          {nextLabel}
          <ArrowRight className="size-4" />
        </LoadingButton>
      </div>
    </div>
  );
}

/** Wrapper that provides motion enter animation for step content. */
export function StepContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex flex-1 flex-col gap-5 py-5", className)}
    >
      {children}
    </motion.div>
  );
}

/** Re-export ArrowRight for convenience. */
export const ArrowRightIcon: LucideIcon = ArrowRight;
