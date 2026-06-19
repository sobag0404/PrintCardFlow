// PrintCardFlow — Sticky footer with stats + cheatsheet trigger.
"use client";

import * as React from "react";
import { Github, Layers } from "lucide-react";
import { useWizardStore } from "@/lib/store/wizard-store";
import { STEP_ORDER } from "@/lib/domain/types";
import { skuStats } from "@/lib/domain/sku-generator";
import { ShortcutCheatsheet } from "./shortcut-cheatsheet";
import { cn } from "@/lib/utils";

export function AppFooter() {
  const step = useWizardStore((s) => s.step);
  const arts = useWizardStore((s) => s.arts);

  // Show stats only on preset/preview/export steps.
  const showStats = ["preset", "preview", "export"].includes(step);
  const stats = React.useMemo(() => skuStats(arts), [arts]);

  return (
    <footer className="mt-auto border-t border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-10 max-w-7xl items-center gap-3 px-3 sm:px-6">
        {/* Left: version + github */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Layers className="size-3" />
          <span className="hidden sm:inline">v2.0 · web build</span>
          <span className="sm:hidden">v2.0</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <Github className="size-3" />
          </a>
        </div>

        {/* Center: shortcut cheatsheet trigger */}
        <div className="flex flex-1 items-center justify-center">
          <ShortcutCheatsheet />
        </div>

        {/* Right: stats */}
        <div
          className={cn(
            "flex items-center gap-2 text-[11px] tabular-nums",
            showStats ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          aria-hidden={!showStats}
        >
          <span className="text-muted-foreground">
            Артов: <span className="font-semibold text-foreground">{stats.arts}</span>
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">
            SKU: <span className="font-semibold text-foreground">{stats.totalSkus}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
