// PrintCardFlow — RecentPresetsBar (compact horizontal chip strip).
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useWizardStore } from "@/lib/store/wizard-store";
import type { Preset } from "@/lib/domain/types";
import { PresetChip } from "./preset-chip";
import { cn } from "@/lib/utils";

export interface RecentPresetsBarProps {
  /** Called when user clicks a recent preset chip. */
  onPick?: (preset: Preset) => void;
  /** Limit number of chips shown (defaults to all available). */
  limit?: number;
  className?: string;
}

export function RecentPresetsBar({
  onPick,
  limit,
  className,
}: RecentPresetsBarProps) {
  const recentPresetIds = useWizardStore((s) => s.recentPresetIds);
  const presets = useWizardStore((s) => s.presets);

  const recent = React.useMemo(() => {
    const list = recentPresetIds
      .map((id) => presets.find((p) => p.id === id))
      .filter((p): p is Preset => !!p);
    return typeof limit === "number" ? list.slice(0, limit) : list;
  }, [recentPresetIds, presets, limit]);

  if (recent.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="pcf-section-label flex items-center gap-1.5">
        <Clock className="size-3" />
        Недавно использованные
      </div>
      <motion.div
        className="flex flex-wrap gap-1.5"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.04 },
          },
        }}
      >
        {recent.map((p) => (
          <motion.div
            key={p.id}
            variants={{
              hidden: { opacity: 0, y: 4 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <PresetChip preset={p} compact onClick={onPick} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
