// PrintCardFlow — Global keyboard shortcuts.
"use client";

import * as React from "react";
import { useWizardStore } from "@/lib/store/wizard-store";
import {
  triggerDefaultExport,
  triggerZipExport,
} from "@/components/wizard/export-handlers";

// Map Cyrillic layout keys to their Latin equivalents (for Y, Z, /, etc.).
const CYR_TO_LAT: Record<string, string> = {
  "я": "z",
  "Я": "Z",
  "н": "y",
  "Н": "Y",
  ".": "/",
};

function eventKey(e: KeyboardEvent): string {
  const k = e.key;
  // Allow explicit Latin keys as-is.
  if (/^[a-zA-Z/]$/.test(k)) return k.toLowerCase();
  if (CYR_TO_LAT[k]) return CYR_TO_LAT[k].toLowerCase();
  return k.toLowerCase();
}

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

export interface KeyboardShortcutOptions {
  onEscape?: () => void;
  onDuplicate?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(opts: KeyboardShortcutOptions = {}) {
  const { onEscape, onDuplicate, enabled = true } = opts;
  React.useEffect(() => {
    if (!enabled) return;
    function handler(e: KeyboardEvent) {
      const s = useWizardStore.getState();
      const editable = isEditable(e.target);
      const k = eventKey(e);
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z — undo/redo (work even inside inputs).
      if (ctrl && !alt && (k === "z" || k === "y")) {
        const canUndo = s.past.length > 0;
        const canRedo = s.future.length > 0;
        if (k === "z" && !shift && canUndo) {
          e.preventDefault();
          s.undo();
          s.pushToast({ variant: "default", title: "Отменено" });
          return;
        }
        if ((k === "y" || (k === "z" && shift)) && canRedo) {
          e.preventDefault();
          s.redo();
          s.pushToast({ variant: "default", title: "Повторено" });
          return;
        }
      }

      // Esc — close help or onEscape (works inside inputs too).
      if (k === "escape") {
        if (s.helpOpen) {
          e.preventDefault();
          s.setHelpOpen(false);
          return;
        }
        if (onEscape) {
          e.preventDefault();
          onEscape();
          return;
        }
      }

      // Don't trigger nav / export shortcuts inside form fields.
      if (editable) return;

      // Alt+→ / Alt+← — next/prev step.
      if (alt && (k === "arrowright" || k === "arrowleft")) {
        e.preventDefault();
        if (k === "arrowright" && s.canNext()) s.next();
        else if (k === "arrowleft" && s.canPrev()) s.prev();
        return;
      }

      // Ctrl+/ — toggle help.
      if (ctrl && k === "/") {
        e.preventDefault();
        s.setHelpOpen(!s.helpOpen);
        return;
      }

      // Ctrl+S — trigger default export.
      if (ctrl && k === "s") {
        e.preventDefault();
        void triggerDefaultExport();
        return;
      }

      // Ctrl+E — trigger ZIP export.
      if (ctrl && k === "e") {
        e.preventDefault();
        void triggerZipExport();
        return;
      }

      // Ctrl+D — duplicate selected.
      if (ctrl && k === "d") {
        e.preventDefault();
        if (onDuplicate) {
          onDuplicate();
        } else {
          const selected = s.arts.filter((a) => a.selected).map((a) => a.id);
          if (selected.length > 0) {
            s.duplicateArtsBulk(selected);
            s.pushToast({
              variant: "success",
              title: `Дублировано ${selected.length}`,
            });
          }
        }
        return;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onEscape, onDuplicate]);
}
