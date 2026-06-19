// PrintCardFlow — PresetGallery (Dialog with curated template bundles).
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useWizardStore } from "@/lib/store/wizard-store";
import type { Preset } from "@/lib/domain/types";
import {
  GALLERY_BUNDLES,
  GALLERY_CATEGORIES,
  type GalleryBundle,
} from "@/lib/domain/template-gallery";
import { PresetChip } from "./preset-chip";
import { cn } from "@/lib/utils";

// Bundle icon registry — maps icon name (stored on bundle) to component.
import {
  Baby,
  Circle,
  Crown,
  Layers,
  ShoppingBag,
} from "lucide-react";

const BUNDLE_ICONS: Record<string, LucideIcon> = {
  Baby,
  Circle,
  Crown,
  Layers,
  ShoppingBag,
};

const ACCENT_DOT: Record<string, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  fuchsia: "bg-fuchsia-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

const ACCENT_TILE: Record<string, string> = {
  amber: "pcf-accent-amber",
  rose: "pcf-accent-rose",
  pink: "pcf-accent-pink",
  fuchsia: "pcf-accent-fuchsia",
  emerald: "pcf-accent-emerald",
  violet: "pcf-accent-violet",
};

export interface PresetGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PresetGallery({ open, onOpenChange }: PresetGalleryProps) {
  const setPresets = useWizardStore((s) => s.setPresets);
  const presets = useWizardStore((s) => s.presets);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [activeCategory, setActiveCategory] = React.useState<string>("Все");
  const [query, setQuery] = React.useState("");
  const [expandedBundle, setExpandedBundle] = React.useState<string | null>(null);
  const [pendingBundle, setPendingBundle] = React.useState<GalleryBundle | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return GALLERY_BUNDLES.filter((b) => {
      if (activeCategory !== "Все" && b.category !== activeCategory) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.presets.some((p) => p.name.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, query]);

  const handleImport = (bundle: GalleryBundle, mode: "replace" | "add") => {
    const existing = useWizardStore.getState().presets;
    let next: Preset[];
    if (mode === "replace") {
      next = [...bundle.presets];
    } else {
      const map = new Map<string, Preset>(existing.map((p) => [p.id, p]));
      for (const p of bundle.presets) map.set(p.id, p);
      next = Array.from(map.values());
    }
    setPresets(next);
    pushToast({
      variant: "success",
      title:
        mode === "replace"
          ? "Пресеты заменены"
          : "Пресеты добавлены",
      description: `${bundle.name} · ${bundle.presets.length} шт.`,
    });
    setPendingBundle(null);
    onOpenChange(false);
  };

  const handlePreviewClick = (preset: Preset) => {
    // Preview-only chip — toast with details.
    pushToast({
      variant: "default",
      title: preset.name,
      description: `${preset.material || "—"} · ${preset.category || "—"} · ${preset.sizes.length} разм.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px] max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            Галерея шаблонов пресетов
          </DialogTitle>
          <DialogDescription>
            Готовые наборы пресетов для типовых задач. Импортируйте целиком или
            добавьте к своим.
          </DialogDescription>
        </DialogHeader>

        {/* Search + sidebar layout */}
        <div className="grid gap-3 px-6 pb-3 sm:grid-cols-[180px_1fr]">
          {/* Sidebar / mobile tabs */}
          <div className="flex sm:flex-col sm:gap-0.5">
            <div className="flex gap-1 overflow-x-auto scroll-pcf pb-1 sm:hidden">
              {GALLERY_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCategory(c)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
                    activeCategory === c
                      ? "border-foreground/40 bg-foreground/5 text-foreground"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="hidden sm:block">
              <div className="pcf-section-label mb-1">Категории</div>
              {GALLERY_CATEGORIES.map((c) => {
                const count =
                  c === "Все"
                    ? GALLERY_BUNDLES.length
                    : GALLERY_BUNDLES.filter((b) => b.category === c).length;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveCategory(c)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      activeCategory === c
                        ? "bg-accent/40 text-foreground"
                        : "text-muted-foreground hover:bg-accent/20 hover:text-foreground",
                    )}
                  >
                    <span>{c}</span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: search + grid */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-8 pl-8"
              />
            </div>

            <div className="max-h-[60vh] space-y-2 overflow-y-auto scroll-pcf pr-1">
              <AnimatePresence mode="popLayout">
                {filtered.map((bundle) => {
                  const Icon = BUNDLE_ICONS[bundle.icon] ?? Layers;
                  const isExpanded = expandedBundle === bundle.id;
                  return (
                    <motion.div
                      key={bundle.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className={cn(
                        "rounded-xl border border-border/60 bg-card/50 p-3 transition-colors hover:border-foreground/30",
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "grid size-10 shrink-0 place-items-center rounded-lg",
                            ACCENT_TILE[bundle.accent],
                          )}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                ACCENT_DOT[bundle.accent],
                              )}
                              aria-hidden
                            />
                            <span className="text-sm font-semibold">{bundle.name}</span>
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] tabular-nums">
                              {bundle.presets.length}
                            </Badge>
                            <Badge variant="outline" className="h-4 px-1 text-[9px]">
                              {bundle.category}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground pcf-text-balance">
                            {bundle.description}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() =>
                              setExpandedBundle((id) => (id === bundle.id ? null : bundle.id))
                            }
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Свернуть" : "Развернуть"}
                          >
                            <motion.span
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="size-3.5" />
                            </motion.span>
                          </Button>
                          <AlertDialog
                            open={pendingBundle?.id === bundle.id}
                            onOpenChange={(o) =>
                              setPendingBundle(o ? bundle : null)
                            }
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 bg-gradient-to-r from-fuchsia-500/10 via-rose-500/10 to-amber-500/10"
                              >
                                <Download className="size-3.5" />
                                <span className="hidden sm:inline">Импортировать</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Импорт «{bundle.name}»
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Заменить мои пресеты ({presets.length}) на
                                  шаблонные ({bundle.presets.length}), либо
                                  добавить шаблон к существующим?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <div className="flex gap-2">
                                  <AlertDialogAction
                                    className="bg-rose-600 hover:bg-rose-700"
                                    onClick={() => handleImport(bundle, "replace")}
                                  >
                                    Заменить мои
                                  </AlertDialogAction>
                                  <AlertDialogAction
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => handleImport(bundle, "add")}
                                  >
                                    Добавить к моим
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Expandable preview */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <TooltipProvider delayDuration={300}>
                              <div className="mt-3 grid gap-1.5 border-t pt-3 sm:grid-cols-2">
                                {bundle.presets.map((p) => (
                                  <Tooltip key={p.id}>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <PresetChip
                                          preset={p}
                                          editable={false}
                                          onClick={handlePreviewClick}
                                        />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[280px]">
                                      <div className="space-y-0.5 text-[11px]">
                                        <div className="font-semibold">{p.name}</div>
                                        <div className="text-muted-foreground">
                                          {p.description}
                                        </div>
                                        <div className="text-muted-foreground pcf-mono">
                                          {p.material} · {p.category}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </TooltipProvider>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Ничего не найдено. Измените категорию или запрос.
                  <ChevronRight className="ml-1 inline size-3" />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
