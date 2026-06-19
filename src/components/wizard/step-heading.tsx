// PrintCardFlow — Step heading (icon + title + subtitle). Exported for reuse.
"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StepHeadingProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: "amber" | "rose" | "pink" | "fuchsia" | "emerald" | "violet";
  className?: string;
}

const ACCENT_TILE: Record<string, string> = {
  amber: "pcf-accent-amber",
  rose: "pcf-accent-rose",
  pink: "pcf-accent-pink",
  fuchsia: "pcf-accent-fuchsia",
  emerald: "pcf-accent-emerald",
  violet: "pcf-accent-violet",
};

export function StepHeading({
  icon: Icon,
  title,
  subtitle,
  accent = "violet",
  className,
}: StepHeadingProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          ACCENT_TILE[accent],
        )}
      >
        <Icon className="size-5" />
      </motion.div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground pcf-text-balance">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
