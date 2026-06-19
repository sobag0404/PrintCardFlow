// PrintCardFlow — Undo/Redo controls with history-depth badges.
"use client";

import * as React from "react";
import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useWizardStore } from "@/lib/store/wizard-store";
import { cn } from "@/lib/utils";

export function UndoRedoControls({ className }: { className?: string }) {
  const past = useWizardStore((s) => s.past);
  const future = useWizardStore((s) => s.future);
  const undo = useWizardStore((s) => s.undo);
  const redo = useWizardStore((s) => s.redo);
  const pushToast = useWizardStore((s) => s.pushToast);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const onUndo = React.useCallback(() => {
    if (!canUndo) return;
    undo();
    pushToast({ variant: "default", title: "Отменено" });
  }, [canUndo, undo, pushToast]);

  const onRedo = React.useCallback(() => {
    if (!canRedo) return;
    redo();
    pushToast({ variant: "default", title: "Повторено" });
  }, [canRedo, redo, pushToast]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="pcf-focus h-8 w-8"
            disabled={!canUndo}
            onClick={onUndo}
            aria-label="Отменить"
          >
            <Undo2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Отменить (Ctrl+Z) · в истории: {past.length}
        </TooltipContent>
      </Tooltip>
      {past.length > 0 && (
        <span className="text-[10px] tabular-nums text-muted-foreground w-4 text-center">
          {past.length}
        </span>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="pcf-focus h-8 w-8"
            disabled={!canRedo}
            onClick={onRedo}
            aria-label="Повторить"
          >
            <Redo2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Повторить (Ctrl+Y) · в истории: {future.length}
        </TooltipContent>
      </Tooltip>
      {future.length > 0 && (
        <span className="text-[10px] tabular-nums text-muted-foreground w-4 text-center">
          {future.length}
        </span>
      )}
    </div>
  );
}
