// PrintCardFlow — PresetPalette (glass container with grid of PresetChips).
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useWizardStore } from "@/lib/store/wizard-store";
import type { Preset } from "@/lib/domain/types";
import { PresetChip } from "./preset-chip";
import { PresetEditor } from "./preset-editor";
import { PresetGallery } from "./preset-gallery";
import { cn } from "@/lib/utils";

export interface PresetPaletteProps {
  /** Called when user picks a preset (after the empty-selection guard). */
  onAssign?: (presetId: string) => void;
  /** When true, hide the "Галерея" button (e.g. inside the gallery dialog itself). */
  hideGalleryButton?: boolean;
  className?: string;
}

export function PresetPalette({
  onAssign,
  hideGalleryButton = false,
  className,
}: PresetPaletteProps) {
  const presets = useWizardStore((s) => s.presets);
  const arts = useWizardStore((s) => s.arts);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingPreset, setEditingPreset] = React.useState<Preset | null>(null);
  const [galleryOpen, setGalleryOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedCount = React.useMemo(
    () => arts.filter((a) => a.selected).length,
    [arts],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [presets, query]);

  const handleChipClick = (preset: Preset) => {
    if (selectedCount === 0) {
      pushToast({
        variant: "warning",
        title: "Сначала выберите арты",
        description: "Отметьте арты в таблице, чтобы назначить пресет.",
      });
      return;
    }
    onAssign?.(preset.id);
  };

  const handleCreate = () => {
    setEditingPreset(null);
    setEditorOpen(true);
  };

  const handleEdit = (preset: Preset) => {
    setEditingPreset(preset);
    setEditorOpen(true);
  };

  return (
    <div className={cn("glass rounded-xl border border-border/60 p-3", className)}>
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">Пресеты</span>
          <Badge variant="secondary" className="h-4 px-1 text-[10px] tabular-nums">
            {presets.length}
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={handleCreate}
            aria-label="Создать свой пресет"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Создать свой</span>
          </Button>
          {!hideGalleryButton && (
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => setGalleryOpen(true)}
              aria-label="Открыть галерею шаблонов"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Галерея</span>
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      {presets.length > 4 && (
        <div className="relative mb-2.5">
          <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск пресета…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-7 text-xs"
          />
        </div>
      )}

      {/* Grid */}
      <div className="grid max-h-[420px] grid-cols-1 gap-1.5 overflow-y-auto scroll-pcf pr-1 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <PresetChip
                preset={p}
                editable
                onClick={handleChipClick}
                onEdit={handleEdit}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Ничего не найдено. Создайте новый пресет или измените запрос.
        </div>
      )}

      <PresetEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        preset={editingPreset}
      />
      <PresetGallery open={galleryOpen} onOpenChange={setGalleryOpen} />
    </div>
  );
}
