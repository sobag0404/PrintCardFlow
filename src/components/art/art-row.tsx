// PrintCardFlow — ArtRow (dnd-kit sortable row, 7-column CSS grid).
"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useWizardStore } from "@/lib/store/wizard-store";
import { IP_CODES } from "@/lib/domain/ip-codes";
import type { Art, IpCode, Preset } from "@/lib/domain/types";
import { SkuBadge } from "./sku-badge";
import { cn } from "@/lib/utils";

/** Grid template shared with ArtTable header. 7 columns. */
export const ART_ROW_GRID =
  "grid items-center gap-2 px-2 py-2 [grid-template-columns:24px_24px_minmax(0,1fr)_180px_120px_minmax(0,1fr)_72px]";

const ACCENT_DOT: Record<string, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  fuchsia: "bg-fuchsia-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

export interface ArtRowProps {
  art: Art;
  presets: Preset[];
  /** When provided, the row will be rendered without drag listeners (e.g. for non-sortable contexts). */
  disableDrag?: boolean;
}

export function ArtRow({ art, presets, disableDrag }: ArtRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: art.id, disabled: disableDrag });

  const toggleSelect = useWizardStore((s) => s.toggleSelect);
  const assignPreset = useWizardStore((s) => s.assignPreset);
  const setIpCode = useWizardStore((s) => s.setIpCode);
  const duplicateArt = useWizardStore((s) => s.duplicateArt);
  const removeArt = useWizardStore((s) => s.removeArt);
  const pushToast = useWizardStore((s) => s.pushToast);

  const preset = presets.find((p) => p.id === art.presetId);
  const skus = art.computedSkus ?? [];
  const previewSku = skus[0]?.sku ?? "—";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        ART_ROW_GRID,
        "rounded-md border bg-background/40 transition-colors hover:bg-accent/30",
        isDragging && "z-50 shadow-lg ring-2 ring-rose-500/40",
        art.selected && "ring-1 ring-amber-500/40 bg-amber-500/5",
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Перетащить для сортировки"
        disabled={disableDrag}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {/* Checkbox */}
      <Checkbox
        checked={art.selected}
        onCheckedChange={() => toggleSelect(art.id)}
        aria-label={`Выбрать ${art.artName}`}
      />

      {/* Art name + source */}
      <div className="min-w-0">
        <div className="truncate pcf-mono text-sm font-medium">{art.artName}</div>
        {art.source && (
          <div className="truncate text-[10px] text-muted-foreground">{art.source}</div>
        )}
      </div>

      {/* Preset select */}
      <Select
        value={art.presetId || "__none__"}
        onValueChange={(v) => assignPreset(art.id, v === "__none__" ? "" : v)}
      >
        <SelectTrigger className="h-8 w-full" size="sm">
          <SelectValue placeholder="Не выбран">
            {preset && (
              <span className="flex items-center gap-1.5">
                <span
                  className={cn("size-2 rounded-full", ACCENT_DOT[preset.accent])}
                  aria-hidden
                />
                <span className="truncate">{preset.name}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">
            <span className="text-muted-foreground">Не выбран</span>
          </SelectItem>
          {presets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-1.5">
                <span
                  className={cn("size-2 rounded-full", ACCENT_DOT[p.accent])}
                  aria-hidden
                />
                <span>{p.name}</span>
                <span className="text-[10px] text-muted-foreground">· {p.material}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* IP select */}
      <Select
        value={art.ipCode ?? "__inherit__"}
        onValueChange={(v) =>
          setIpCode(art.id, v === "__inherit__" ? null : (v as IpCode))
        }
      >
        <SelectTrigger className="h-8 w-full pcf-mono" size="sm">
          <SelectValue placeholder="—">{art.ipCode ?? "—"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__inherit__">
            <span className="text-muted-foreground">По умолчанию</span>
          </SelectItem>
          {IP_CODES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="pcf-mono">{c.code}</span>
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                {c.description}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* SKU preview */}
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex min-w-0 cursor-help items-center gap-1">
              {skus.length === 0 ? (
                <span className="truncate text-[11px] text-muted-foreground">—</span>
              ) : (
                <SkuBadge sku={previewSku} showCopy={false} />
              )}
              {skus.length > 1 && (
                <Badge
                  variant="secondary"
                  className="h-4 shrink-0 px-1 text-[9px] tabular-nums"
                >
                  +{skus.length - 1}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[420px]">
            <div className="space-y-0.5 pcf-mono text-[11px]">
              {skus.length === 0 ? (
                <div>Нет SKU (пресет не выбран)</div>
              ) : (
                skus.map((s, i) => <div key={i}>{s.sku}</div>)
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Actions */}
      <div className="flex items-center justify-end gap-0.5">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground"
          onClick={() => {
            duplicateArt(art.id);
            pushToast({ variant: "default", title: "Дублировано" });
          }}
          aria-label="Дублировать"
        >
          <Copy className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-rose-500"
          onClick={() => {
            removeArt(art.id);
            pushToast({ variant: "default", title: "Удалено" });
          }}
          aria-label="Удалить"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
