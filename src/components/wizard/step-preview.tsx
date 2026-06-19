// PrintCardFlow — Step "Preview": virtualized SKU table.
"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";
import {
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Eye,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { skuStats } from "@/lib/domain/sku-generator";
import type { Art, GeneratedSku } from "@/lib/domain/types";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { ValidationBanner } from "@/components/shared/validation-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import { StepContainer, WizardFooterNav } from "./wizard-footer-nav";

interface FlatRow {
  type: "art-header" | "sku";
  art: Art;
  sku?: GeneratedSku;
  index: number; // index within flattened array
}

function flattenArts(arts: Art[]): FlatRow[] {
  const out: FlatRow[] = [];
  for (const art of arts) {
    out.push({ type: "art-header", art, index: out.length });
    for (const sku of art.computedSkus ?? []) {
      out.push({ type: "sku", art, sku, index: out.length });
    }
  }
  return out;
}

const ACCENT_DOT: Record<string, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  fuchsia: "bg-fuchsia-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className={`pcf-stat-card rounded-lg border p-3 ${accent}`}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="pcf-stat-number mt-1 text-xl font-bold tabular-nums">
        <AnimatedNumber value={value} />
      </div>
    </div>
  );
}

export function StepPreview() {
  const arts = useWizardStore((s) => s.arts);
  const presets = useWizardStore((s) => s.presets);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [query, setQuery] = React.useState("");
  const [presetFilter, setPresetFilter] = React.useState<string>("__all__");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const stats = React.useMemo(() => skuStats(arts), [arts]);

  const filteredArts = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return arts.filter((a) => {
      if (presetFilter !== "__all__") {
        if (presetFilter === "__none__") {
          if (a.presetId) return false;
        } else if (a.presetId !== presetFilter) {
          return false;
        }
      }
      if (q) {
        const inName = a.artName.toLowerCase().includes(q);
        const inSku = (a.computedSkus ?? []).some((s) =>
          s.sku.toLowerCase().includes(q),
        );
        if (!inName && !inSku) return false;
      }
      return true;
    });
  }, [arts, query, presetFilter]);

  const flatRows = React.useMemo(() => {
    const out: FlatRow[] = [];
    for (const art of filteredArts) {
      if (collapsed.has(art.id)) {
        out.push({ type: "art-header", art, index: out.length });
      } else {
        out.push({ type: "art-header", art, index: out.length });
        for (const sku of art.computedSkus ?? []) {
          out.push({ type: "sku", art, sku, index: out.length });
        }
      }
    }
    return out;
  }, [filteredArts, collapsed]);

  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (flatRows[i]?.type === "art-header" ? 44 : 40),
    overscan: 8,
  });

  const toggleCollapse = (artId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(artId)) next.delete(artId);
      else next.add(artId);
      return next;
    });
  };

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(filteredArts.map((a) => a.id)));

  const onCopy = async (sku: GeneratedSku) => {
    try {
      await navigator.clipboard.writeText(sku.sku);
      pushToast({
        variant: "success",
        title: "SKU скопирован",
        description: sku.sku,
      });
    } catch {
      pushToast({ variant: "error", title: "Не удалось скопировать" });
    }
  };

  const items = virtualizer.getVirtualItems();

  return (
    <StepContainer>
      <StepHeading
        icon={Eye}
        title="Просмотр SKU"
        subtitle="Виртуализированный список всех сгенерированных SKU. Кликайте по строке, чтобы скопировать."
        accent="emerald"
      />

      <ValidationBanner />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Артов" value={stats.arts} accent="pcf-accent-emerald" />
        <MiniStat label="С пресетом" value={stats.assigned} accent="pcf-accent-amber" />
        <MiniStat label="Всего SKU" value={stats.totalSkus} accent="pcf-accent-violet" />
        <MiniStat
          label="В среднем SKU/арт"
          value={stats.arts > 0 ? Math.round(stats.totalSkus / stats.arts) : 0}
          accent="pcf-accent-rose"
        />
      </div>

      {/* Toolbar */}
      <div className="pcf-toolbar flex flex-wrap items-center gap-2 rounded-lg border bg-card/50 p-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или SKU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-8"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Очистить"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Select value={presetFilter} onValueChange={setPresetFilter}>
          <SelectTrigger size="sm" className="h-8 w-[160px]">
            <SelectValue placeholder="Все пресеты" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Все пресеты</SelectItem>
            <SelectItem value="__none__">Без пресета</SelectItem>
            {presets.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8" onClick={expandAll}>
          <ChevronsUpDown className="size-3.5" />
          Развернуть
        </Button>
        <Button variant="outline" size="sm" className="h-8" onClick={collapseAll}>
          <ChevronsDownUp className="size-3.5" />
          Свернуть
        </Button>
      </div>

      {/* Virtualized table */}
      <div className="rounded-xl border bg-card/40">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 grid items-center gap-2 border-b bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          style={{
            gridTemplateColumns:
              "20px minmax(0,1fr) 60px 80px 100px 80px minmax(0,1.4fr) 32px",
          }}
        >
          <span />
          <span>Имя арта</span>
          <span>№</span>
          <span>Размер</span>
          <span>Материал</span>
          <span>IP</span>
          <span>SKU</span>
          <span />
        </div>

        {flatRows.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="Нет данных для предпросмотра"
            description={
              arts.length === 0
                ? "Сначала отсканируйте папку и назначьте пресеты."
                : "Попробуйте изменить фильтр или поиск."
            }
            accent="emerald"
            className="m-3"
          />
        ) : (
          <div
            ref={parentRef}
            className="max-h-[60vh] overflow-y-auto scroll-pcf"
            style={{ position: "relative" }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {items.map((vi) => {
                const idx = Number(vi.key);
                const row = flatRows[idx];
                if (!row) return null;
                const startY = vi.start;
                if (row.type === "art-header") {
                  const isCollapsed = collapsed.has(row.art.id);
                  const preset = presets.find((p) => p.id === row.art.presetId);
                  return (
                    <div
                      key={vi.key}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${startY}px)`,
                        height: "44px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleCollapse(row.art.id)}
                        className="flex h-11 w-full items-center gap-2 border-b bg-background/60 px-3 text-left transition-colors hover:bg-accent/40"
                      >
                        <span
                          className={cn(
                            "size-2 shrink-0 rounded-full",
                            preset ? ACCENT_DOT[preset.accent] : "bg-muted-foreground/40",
                          )}
                        />
                        <span className="truncate pcf-mono text-sm font-semibold">
                          {row.art.artName}
                        </span>
                        {preset && (
                          <Badge variant="outline" className="text-[10px]">
                            {preset.name}
                          </Badge>
                        )}
                        <span className="ml-auto text-[10px] text-muted-foreground">
                          {row.art.computedSkus?.length ?? 0} SKU
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {isCollapsed ? "▸" : "▾"}
                        </span>
                      </button>
                    </div>
                  );
                }
                // sku row
                const sku = row.sku!;
                return (
                  <div
                    key={vi.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${startY}px)`,
                      height: "40px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onCopy(sku)}
                      className="grid h-10 w-full items-center gap-2 border-b border-dashed px-3 text-left transition-colors hover:bg-accent/40 group"
                      style={{
                        gridTemplateColumns:
                          "20px minmax(0,1fr) 60px 80px 100px 80px minmax(0,1.4fr) 32px",
                      }}
                    >
                      <span className="text-muted-foreground/40">·</span>
                      <span className="truncate pcf-mono text-xs text-muted-foreground">
                        ↳ {row.art.artName}
                      </span>
                      <span className="pcf-mono text-xs tabular-nums text-muted-foreground">
                        {String(sku.seqNum).padStart(3, "0")}
                      </span>
                      <span className="truncate pcf-mono text-xs">{sku.size}</span>
                      <span className="truncate pcf-mono text-xs text-muted-foreground">
                        {sku.material}
                      </span>
                      <span className="pcf-mono text-xs">{sku.ip || "—"}</span>
                      <span className="truncate pcf-mono text-xs font-medium">
                        {sku.sku}
                      </span>
                      <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        <Copy className="size-3.5" />
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <WizardFooterNav prevLabel="К пресетам" nextLabel="К экспорту" />
    </StepContainer>
  );
}
