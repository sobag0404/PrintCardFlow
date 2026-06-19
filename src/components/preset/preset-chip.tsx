// PrintCardFlow — PresetChip (compact + full preset chip).
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Pencil, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Preset } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const ACCENT_DOT: Record<string, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  fuchsia: "bg-fuchsia-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

const ACCENT_CHIP: Record<string, string> = {
  amber: "pcf-accent-amber",
  rose: "pcf-accent-rose",
  pink: "pcf-accent-pink",
  fuchsia: "pcf-accent-fuchsia",
  emerald: "pcf-accent-emerald",
  violet: "pcf-accent-violet",
};

export interface PresetChipProps {
  preset: Preset;
  /** Compact mode = dot + name only. Full mode = accent dot + name + meta + badges. */
  compact?: boolean;
  /** Show the "свой" badge for custom presets (only used in full mode). */
  showCustomBadge?: boolean;
  /** Show hover pencil edit affordance. */
  editable?: boolean;
  onClick?: (preset: Preset) => void;
  onEdit?: (preset: Preset) => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PresetChip({
  preset,
  compact = false,
  showCustomBadge = true,
  editable = false,
  onClick,
  onEdit,
  selected = false,
  disabled = false,
  className,
}: PresetChipProps) {
  const accentDot = ACCENT_DOT[preset.accent] ?? "bg-violet-500";
  const accentChip = ACCENT_CHIP[preset.accent] ?? "pcf-accent-violet";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(preset);
    }
  };

  if (compact) {
    return (
      <motion.button
        type="button"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={`Пресет ${preset.name}`}
        disabled={disabled}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        onClick={() => !disabled && onClick?.(preset)}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs font-medium transition-colors",
          "hover:border-foreground/40 focus-visible:outline-none focus-visible:pcf-focus",
          accentChip,
          selected && "ring-1 ring-foreground/40",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <span className={cn("size-1.5 rounded-full", accentDot)} aria-hidden />
        <span className="truncate max-w-[140px]">{preset.name}</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={`Пресет ${preset.name}${preset.description ? ` — ${preset.description}` : ""}`}
      onClick={() => !disabled && onClick?.(preset)}
      onKeyDown={handleKeyDown}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1 rounded-lg border border-border/60 bg-background/40 p-2.5 text-left transition-all",
        "hover:border-foreground/30 hover:bg-accent/30 focus-visible:outline-none focus-visible:pcf-focus",
        accentChip,
        "pcf-accent-glow",
        selected && "ring-1 ring-foreground/40",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {/* Top row: dot + name + custom badge + edit */}
      <div className="flex items-center gap-1.5">
        <span className={cn("pcf-accent-dot size-2 shrink-0 rounded-full", accentDot)} aria-hidden />
        <span className="flex-1 truncate text-sm font-semibold">{preset.name}</span>
        {showCustomBadge && preset.kind === "custom" && (
          <Badge
            variant="outline"
            className="border-violet-500/40 px-1 py-0 text-[9px] text-violet-600 dark:text-violet-400"
          >
            <Star className="size-2.5" />
            свой
          </Badge>
        )}
        {editable && onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(preset);
            }}
            aria-label={`Редактировать «${preset.name}»`}
            className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Pencil className="size-3" />
          </button>
        )}
      </div>

      {/* Meta row: material · category */}
      <div className="text-[10px] text-muted-foreground">
        {[preset.material, preset.category].filter(Boolean).join(" · ") || "—"}
      </div>

      {/* Bottom row: size-count badge + IP badge */}
      <div className="flex items-center gap-1">
        <Badge
          variant="secondary"
          className="h-4 px-1 text-[9px] font-medium tabular-nums"
        >
          {preset.sizes.length} разм.
        </Badge>
        {preset.ipEnabledDefault && (
          <Badge
            variant="outline"
            className="h-4 border-violet-500/40 px-1 text-[9px] text-violet-600 dark:text-violet-400"
          >
            IP
          </Badge>
        )}
      </div>
    </motion.div>
  );
}
