// PrintCardFlow — Toast stack (top-right AnimatePresence).
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useWizardStore, type ToastEntry } from "@/lib/store/wizard-store";
import { cn } from "@/lib/utils";
import { useLowPowerMode } from "@/lib/performance-mode";

const TOAST_DURATION = 4000;

const VARIANT_CONFIG: Record<
  ToastEntry["variant"],
  { icon: LucideIcon; border: string; iconColor: string }
> = {
  default: {
    icon: Info,
    border: "border-border",
    iconColor: "text-muted-foreground",
  },
  success: {
    icon: CheckCircle2,
    border: "border-emerald-500/40",
    iconColor: "text-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/40",
    iconColor: "text-amber-500",
  },
  error: {
    icon: XCircle,
    border: "border-rose-500/40",
    iconColor: "text-rose-500",
  },
};

function ToastCard({ toast }: { toast: ToastEntry }) {
  const dismiss = useWizardStore((s) => s.dismissToast);
  const cfg = VARIANT_CONFIG[toast.variant];
  const Icon = cfg.icon;
  const lowPower = useLowPowerMode();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "glass-strong pointer-events-auto relative w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-background/95 shadow-xl",
        cfg.border,
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", cfg.iconColor)} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-tight">{toast.title}</div>
          {toast.description && (
            <div className="mt-1 text-xs text-muted-foreground break-words">
              {toast.description}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          className="pcf-focus rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Закрыть уведомление"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {/* Countdown bar */}
      <div className="h-0.5 w-full bg-muted/40">
        <div
          className={cn(
            "h-full origin-left bg-current opacity-60",
            cfg.iconColor,
            !lowPower && "animate-[pcf-toast-progress_linear_forwards]",
          )}
          style={{ animationDuration: `${TOAST_DURATION}ms` }}
        />
      </div>
    </motion.div>
  );
}

export function ToastStack() {
  const toasts = useWizardStore((s) => s.toasts);
  return (
    <div
      className="pointer-events-none fixed top-3 right-3 z-[60] flex flex-col items-end gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
