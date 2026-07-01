// PrintCardFlow — Empty state (reusable, with accent variants).
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { useLowPowerMode } from "@/lib/performance-mode";
import { cn } from "@/lib/utils";

export type EmptyAccent = "amber" | "rose" | "pink" | "fuchsia" | "emerald" | "violet";

const ACCENT_CLASSES: Record<EmptyAccent, string> = {
  amber: "pcf-accent-amber",
  rose: "pcf-accent-rose",
  pink: "pcf-accent-pink",
  fuchsia: "pcf-accent-fuchsia",
  emerald: "pcf-accent-emerald",
  violet: "pcf-accent-violet",
};

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  accent?: EmptyAccent;
  bare?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  accent = "violet",
  bare = false,
  className,
}: EmptyStateProps) {
  const lowPower = useLowPowerMode();
  const Wrapper = bare ? "div" : motion.div;
  return (
    <Wrapper
      className={cn(
        !bare && "rounded-xl border border-dashed border-border/70 p-8 text-center",
        className,
      )}
      {...(!bare
        ? {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3 },
          }
        : {})}
    >
      <div className="flex justify-center">
        <motion.div
          className={cn(
            "pcf-empty-icon grid size-14 place-items-center rounded-xl",
            ACCENT_CLASSES[accent],
          )}
          animate={lowPower ? undefined : { y: [0, -4, 0] }}
          transition={lowPower ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon className="size-6" />
        </motion.div>
      </div>
      <div className="mt-4 text-base font-semibold">{title}</div>
      {description && (
        <div className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground pcf-text-balance">
          {description}
        </div>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Wrapper>
  );
}
