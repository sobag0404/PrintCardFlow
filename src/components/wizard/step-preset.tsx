// PrintCardFlow — Step "Preset": core editing step (dnd-kit sortable + bulk actions).
"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  GripVertical,
  Layers,
  Paintbrush,
  Replace,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  SquareStack,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useWizardStore } from "@/lib/store/wizard-store";
import { BUILTIN_PRESETS } from "@/lib/domain/presets";
import { IP_CODES } from "@/lib/domain/ip-codes";
import { skuStats } from "@/lib/domain/sku-generator";
import type { Art, IpCode, Preset } from "@/lib/domain/types";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { UndoRedoControls } from "@/components/shared/undo-redo-controls";
import { ValidationBanner } from "@/components/shared/validation-banner";
import { SaveProjectButton } from "@/components/shared/project-manager";
import { SearchReplaceDialog as SearchReplaceDialogComp } from "@/components/shared/search-replace-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";
import { StepContainer, WizardFooterNav } from "./wizard-footer-nav";

// Grid template for art rows. 5 columns: drag, checkbox, name, preset, ip, sku, actions.
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

const ACCENT_CHIP: Record<string, string> = {
  amber: "pcf-accent-amber",
  rose: "pcf-accent-rose",
  pink: "pcf-accent-pink",
  fuchsia: "pcf-accent-fuchsia",
  emerald: "pcf-accent-emerald",
  violet: "pcf-accent-violet",
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

// ─────────────────────────────────────────────────────────────
// Sortable art row
// ─────────────────────────────────────────────────────────────
function SortableArtRow({ art, presets }: { art: Art; presets: Preset[] }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: art.id });

  const toggleSelect = useWizardStore((s) => s.toggleSelect);
  const updateArt = useWizardStore((s) => s.updateArt);
  const assignPreset = useWizardStore((s) => s.assignPreset);
  const setIpCode = useWizardStore((s) => s.setIpCode);
  const duplicateArt = useWizardStore((s) => s.duplicateArt);
  const removeArt = useWizardStore((s) => s.removeArt);
  const pushToast = useWizardStore((s) => s.pushToast);

  const preset = presets.find((p) => p.id === art.presetId);
  const skus = art.computedSkus ?? [];
  const previewSku = skus[0]?.sku ?? "—";

  const style = {
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
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Перетащить для сортировки"
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

      {/* Art name */}
      <div className="min-w-0">
        <div className="truncate pcf-mono text-sm font-medium">
          {art.artName}
        </div>
        {skus.length > 1 && (
          <div className="text-[10px] text-muted-foreground">
            {skus.length} SKU
          </div>
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
                <span className={cn("size-2 rounded-full", ACCENT_DOT[preset.accent])} />
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
                <span className={cn("size-2 rounded-full", ACCENT_DOT[p.accent])} />
                <span>{p.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  · {p.material}
                </span>
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
          <SelectValue placeholder="—">
            {art.ipCode ?? "—"}
          </SelectValue>
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
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="min-w-0 cursor-help truncate pcf-mono text-[11px] text-muted-foreground">
            {previewSku}
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

// ─────────────────────────────────────────────────────────────
// Main step
// ─────────────────────────────────────────────────────────────
export function StepPreset() {
  const arts = useWizardStore((s) => s.arts);
  const presets = useWizardStore((s) => s.presets);
  const recentPresetIds = useWizardStore((s) => s.recentPresetIds);
  const setArts = useWizardStore((s) => s.setArts);
  const selectAll = useWizardStore((s) => s.selectAll);
  const invertSelection = useWizardStore((s) => s.invertSelection);
  const assignPresetBulk = useWizardStore((s) => s.assignPresetBulk);
  const setIpCodeBulk = useWizardStore((s) => s.setIpCodeBulk);
  const duplicateArtsBulk = useWizardStore((s) => s.duplicateArtsBulk);
  const clearAllPresets = useWizardStore((s) => s.clearAllPresets);
  const resetAllIpCodes = useWizardStore((s) => s.resetAllIpCodes);
  const removeSelected = useWizardStore((s) => s.removeSelected);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [bulkPreset, setBulkPreset] = React.useState<string>("__none__");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return arts;
    return arts.filter((a) => a.artName.toLowerCase().includes(q));
  }, [arts, query]);

  const selectedArts = arts.filter((a) => a.selected);
  const selectedIds = selectedArts.map((a) => a.id);
  const stats = React.useMemo(() => skuStats(arts), [arts]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = arts.findIndex((a) => a.id === active.id);
    const newIndex = arts.findIndex((a) => a.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setArts(arrayMove(arts, oldIndex, newIndex));
  };

  const onAssignBulkPreset = () => {
    if (selectedIds.length === 0) {
      pushToast({ variant: "warning", title: "Нет выбранных артов" });
      return;
    }
    if (bulkPreset === "__none__") {
      pushToast({ variant: "warning", title: "Выберите пресет" });
      return;
    }
    assignPresetBulk(selectedIds, bulkPreset);
    const p = presets.find((x) => x.id === bulkPreset);
    pushToast({
      variant: "success",
      title: `Назначен пресет ${p?.name ?? ""}`,
      description: `${selectedIds.length} артов`,
    });
  };

  const recentPresets = React.useMemo(
    () =>
      recentPresetIds
        .map((id) => presets.find((p) => p.id === id))
        .filter((p): p is Preset => !!p)
        .slice(0, 5),
    [recentPresetIds, presets],
  );

  return (
    <StepContainer>
      <StepHeading
        icon={Layers}
        title="Назначение пресетов"
        subtitle="Перетащите арты для сортировки, назначьте пресеты и IP-коды, проверьте дубликаты."
        accent="violet"
      />

      <ValidationBanner />

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        {/* Left: toolbar + table */}
        <div className="space-y-3">
          {/* Toolbar Row 1 */}
          <div className="pcf-toolbar flex flex-wrap items-center gap-2 rounded-lg border bg-card/50 p-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск арта…"
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
            <UndoRedoControls />
            <SaveProjectButton />
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setSearchOpen(true)}
            >
              <Replace className="size-3.5" />
              <span className="hidden sm:inline">Поиск и замена</span>
            </Button>
          </div>

          {/* Toolbar Row 2: selection + edit */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card/50 p-2">
            {/* Selection group */}
            <div className="flex items-center gap-1">
              <span className="px-1 text-[11px] font-semibold uppercase text-muted-foreground">
                Выбор
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => selectAll(true)}
              >
                Все
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => selectAll(false)}
              >
                Снять
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => invertSelection()}
              >
                Инверт.
              </Button>
              <Select value={bulkPreset} onValueChange={setBulkPreset}>
                <SelectTrigger size="sm" className="h-7 w-[140px]">
                  <SelectValue placeholder="по пресету" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => {
                  if (bulkPreset === "__none__") return;
                  const ids = arts
                    .filter((a) => a.presetId === bulkPreset)
                    .map((a) => a.id);
                  if (ids.length === 0) {
                    selectAll(false);
                  } else {
                    selectAll(false);
                    for (const id of ids) {
                      const a = arts.find((x) => x.id === id);
                      if (a && !a.selected) {
                        useWizardStore.getState().toggleSelect(id);
                      }
                    }
                  }
                }}
              >
                Выбрать
              </Button>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-1">
              <span className="px-1 text-[11px] font-semibold uppercase text-muted-foreground">
                Действие
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                disabled={selectedIds.length === 0}
                onClick={() => {
                  duplicateArtsBulk(selectedIds);
                  pushToast({
                    variant: "success",
                    title: `Дублировано: ${selectedIds.length}`,
                  });
                }}
              >
                <Copy className="size-3.5" />
                Дублировать {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => {
                  resetAllIpCodes();
                  pushToast({ variant: "default", title: "IP-коды сброшены" });
                }}
              >
                <RotateCcw className="size-3.5" />
                <span className="hidden md:inline">Сбросить IP</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7">
                    <Paintbrush className="size-3.5" />
                    <span className="hidden md:inline">Очистить пресеты</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Очистить все пресеты?</AlertDialogTitle>
                    <AlertDialogDescription>
                      У всех артов будет снято назначение пресета. Действие можно отменить (Ctrl+Z).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        clearAllPresets();
                        pushToast({ variant: "default", title: "Пресеты очищены" });
                      }}
                    >
                      Да, очистить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                disabled={selectedIds.length === 0}
                onClick={() => {
                  removeSelected();
                  pushToast({
                    variant: "default",
                    title: `Удалено: ${selectedIds.length}`,
                  });
                }}
              >
                <Trash2 className="size-3.5" />
                Удалить {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
              </Button>
            </div>
          </div>

          {/* Bulk IP bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2">
            <span className="px-1 text-[11px] font-semibold uppercase text-violet-600 dark:text-violet-400">
              IP для выбранных
            </span>
            <Select
              value="__none__"
              onValueChange={(v) => {
                if (selectedIds.length === 0) {
                  pushToast({ variant: "warning", title: "Нет выбранных артов" });
                  return;
                }
                setIpCodeBulk(selectedIds, v === "__null__" ? null : (v as IpCode));
                pushToast({
                  variant: "success",
                  title: `IP-код назначен`,
                  description: `${selectedIds.length} артов`,
                });
              }}
            >
              <SelectTrigger size="sm" className="h-7 w-[140px]">
                <SelectValue placeholder="Назначить IP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__null__">
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
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={onAssignBulkPreset}
            >
              Назначить пресет выбранным
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-xl border bg-card/40">
            {/* Header row */}
            <div className={cn(ART_ROW_GRID, "border-b bg-muted/30 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground")}>
              <span />
              <span />
              <span>Имя арта</span>
              <span>Пресет</span>
              <span>IP</span>
              <span>SKU (первый)</span>
              <span className="text-right">Действия</span>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={Layers}
                title={arts.length === 0 ? "Список артов пуст" : "Ничего не найдено"}
                description={
                  arts.length === 0
                    ? "Вернитесь на шаг «Папка» и отсканируйте папку."
                    : "Измените поисковый запрос."
                }
                accent="violet"
                className="m-3"
              />
            ) : (
              <TooltipProvider delayDuration={300}>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={filtered.map((a) => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="max-h-[55vh] space-y-1 overflow-y-auto scroll-pcf p-1">
                      <AnimatePresence>
                        {filtered.map((art) => (
                          <motion.div
                            key={art.id}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.15 }}
                          >
                            <SortableArtRow art={art} presets={presets} />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </DndContext>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Right: stats + recent + palette */}
        <aside className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Артов" value={stats.arts} accent="pcf-accent-violet" />
            <MiniStat label="С пресетом" value={stats.assigned} accent="pcf-accent-emerald" />
            <MiniStat label="SKU" value={stats.totalSkus} accent="pcf-accent-amber" />
          </div>

          {/* Recent presets */}
          {recentPresets.length > 0 && (
            <div className="rounded-lg border bg-card/50 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Sparkles className="size-3" />
                Недавние пресеты
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentPresets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (selectedIds.length === 0) {
                        pushToast({
                          variant: "warning",
                          title: "Сначала выберите арты",
                        });
                        return;
                      }
                      assignPresetBulk(selectedIds, p.id);
                      pushToast({
                        variant: "success",
                        title: `Назначен: ${p.name}`,
                        description: `${selectedIds.length} артов`,
                      });
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-xs transition-all hover:border-foreground/40",
                      ACCENT_CHIP[p.accent],
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full pcf-accent-dot", ACCENT_DOT[p.accent])} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preset palette */}
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <SquareStack className="size-3" />
              Палитра пресетов
            </div>
            <div className="space-y-1.5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (selectedIds.length === 0) {
                      pushToast({
                        variant: "warning",
                        title: "Сначала выберите арты",
                      });
                      return;
                    }
                    assignPresetBulk(selectedIds, p.id);
                    pushToast({
                      variant: "success",
                      title: `Назначен: ${p.name}`,
                      description: `${selectedIds.length} артов`,
                    });
                  }}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5 text-left text-xs transition-all hover:border-foreground/40 hover:bg-accent/30",
                    ACCENT_CHIP[p.accent],
                  )}
                >
                  <span className="relative flex size-2 shrink-0">
                    <span
                      className={cn(
                        "absolute inline-flex size-full rounded-full opacity-60",
                        ACCENT_DOT[p.accent],
                      )}
                      style={{ animation: "pulse 2s infinite" }}
                    />
                    <span className={cn("relative inline-flex size-2 rounded-full", ACCENT_DOT[p.accent])} />
                  </span>
                  <span className="flex-1 truncate font-medium">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {p.category}
                  </span>
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" disabled>
              <Settings2 className="size-3" />
              Галерея
            </Button>
          </div>
        </aside>
      </div>

      <WizardFooterNav prevLabel="К сканированию" nextLabel="К просмотру" />

      <SearchReplaceDialogComp open={searchOpen} onOpenChange={setSearchOpen} />
    </StepContainer>
  );
}
