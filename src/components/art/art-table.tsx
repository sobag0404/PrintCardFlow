// PrintCardFlow — ArtTable (reusable dnd-kit sortable card).
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
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWizardStore } from "@/lib/store/wizard-store";
import { EmptyState } from "@/components/shared/empty-state";
import { ArtRow, ART_ROW_GRID } from "./art-row";
import { cn } from "@/lib/utils";

export interface ArtTableProps {
  /** Optional external filter predicate (e.g. by folder source). */
  filter?: (artId: string) => boolean;
  /** Optional external preset filter: show only arts assigned to this preset id. */
  presetFilter?: string;
  /** Optional max-height CSS value for the scroll area. */
  maxHeight?: string;
  /** Hide the built-in search input. */
  hideSearch?: boolean;
  className?: string;
}

export function ArtTable({
  filter,
  presetFilter,
  maxHeight = "max-h-[55vh]",
  hideSearch = false,
  className,
}: ArtTableProps) {
  const arts = useWizardStore((s) => s.arts);
  const presets = useWizardStore((s) => s.presets);
  const setArts = useWizardStore((s) => s.setArts);

  const [query, setQuery] = React.useState("");
  const [localPresetFilter, setLocalPresetFilter] = React.useState<string>("__all__");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = arts;
    if (filter) list = list.filter((a) => filter(a.id));
    const pf = presetFilter ?? (localPresetFilter === "__all__" ? null : localPresetFilter);
    if (pf) list = list.filter((a) => a.presetId === pf);
    if (q) list = list.filter((a) => a.artName.toLowerCase().includes(q));
    return list;
  }, [arts, filter, presetFilter, localPresetFilter, query]);

  const visibleSelected = filtered.filter((a) => a.selected).length;
  const allVisibleSelected = filtered.length > 0 && visibleSelected === filtered.length;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = arts.findIndex((a) => a.id === active.id);
    const newIndex = arts.findIndex((a) => a.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setArts(arrayMove(arts, oldIndex, newIndex));
  };

  const handleHeaderCheck = () => {
    // Toggle visible arts: if all visible selected → deselect; otherwise select all visible.
    const visibleIds = new Set(filtered.map((a) => a.id));
    const target = !allVisibleSelected;
    const next = useWizardStore.getState().arts.map((a) =>
      visibleIds.has(a.id) ? { ...a, selected: target } : a,
    );
    useWizardStore.setState({ arts: next });
  };

  return (
    <div className={cn("rounded-xl border bg-card/40", className)}>
      {/* Toolbar (search + preset filter) */}
      {(!hideSearch || !presetFilter) && (
        <div className="flex flex-wrap items-center gap-2 border-b p-2">
          {!hideSearch && (
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
          )}
          {!presetFilter && (
            <Select value={localPresetFilter} onValueChange={setLocalPresetFilter}>
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
          )}
          <div className="ml-auto text-[11px] tabular-nums text-muted-foreground">
            {filtered.length} / {arts.length}
          </div>
        </div>
      )}

      {/* Header row */}
      <div
        className={cn(
          ART_ROW_GRID,
          "border-b bg-muted/30 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
        )}
      >
        <span />
        <Checkbox
          checked={allVisibleSelected}
          onCheckedChange={handleHeaderCheck}
          aria-label="Выбрать все видимые"
          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
        />
        <span>Имя арта</span>
        <span>Пресет</span>
        <span>IP</span>
        <span>SKU (первый)</span>
        <span className="text-right">Действия</span>
      </div>

      {/* Body */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={arts.length === 0 ? "Список артов пуст" : "Ничего не найдено"}
          description={
            arts.length === 0
              ? "Вернитесь на шаг «Папка» и отсканируйте папку."
              : "Измените поисковый запрос или фильтр."
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
              <div className={cn("space-y-1 overflow-y-auto scroll-pcf p-1", maxHeight)}>
                <AnimatePresence initial={false}>
                  {filtered.map((art) => (
                    <motion.div
                      key={art.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                    >
                      <ArtRow art={art} presets={presets} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </TooltipProvider>
      )}
    </div>
  );
}
