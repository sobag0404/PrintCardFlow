// PrintCardFlow — IpCodeBadge (mono badge with description tooltip).
"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ipCodeMeta } from "@/lib/domain/ip-codes";
import type { IpCode } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export interface IpCodeBadgeProps {
  code: IpCode;
  className?: string;
}

export function IpCodeBadge({ code, className }: IpCodeBadgeProps) {
  if (!code) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[11px] text-muted-foreground",
          className,
        )}
        aria-label="IP-код не задан"
      >
        —
      </span>
    );
  }

  const meta = ipCodeMeta(code);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex cursor-default items-center rounded-md border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300",
              className,
            )}
            aria-label={`IP-код ${code}${meta ? ` — ${meta.description}` : ""}`}
          >
            <span className="pcf-mono">{code}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-0.5 text-[11px]">
            <div className="font-semibold pcf-mono">{code}</div>
            {meta && <div className="text-muted-foreground">{meta.description}</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
