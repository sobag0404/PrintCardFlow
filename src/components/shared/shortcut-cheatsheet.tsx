// PrintCardFlow — Shortcut cheatsheet popover (triggered by Keyboard icon).
"use client";

import * as React from "react";
import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface Shortcut {
  keys: string[];
  label: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ["Alt", "→"], label: "Следующий шаг" },
  { keys: ["Alt", "←"], label: "Предыдущий шаг" },
  { keys: ["Ctrl", "Z"], label: "Отменить" },
  { keys: ["Ctrl", "Y"], label: "Повторить" },
  { keys: ["Ctrl", "Shift", "Z"], label: "Повторить (альт.)" },
  { keys: ["Ctrl", "/"], label: "Подсказки" },
  { keys: ["Ctrl", "S"], label: "Экспорт по умолчанию" },
  { keys: ["Ctrl", "E"], label: "Экспорт ZIP" },
  { keys: ["Ctrl", "D"], label: "Дублировать" },
  { keys: ["Esc"], label: "Закрыть диалог" },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium pcf-mono">
      {children}
    </kbd>
  );
}

export function ShortcutCheatsheet() {
  return (
    <Popover>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="pcf-focus"
              aria-label="Шпаргалка горячих клавиш"
            >
              <Keyboard className="size-4" />
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent>Горячие клавиши</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Горячие клавиши
        </div>
        <ul className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <React.Fragment key={k}>
                    {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                    <Kbd>{k}</Kbd>
                  </React.Fragment>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
