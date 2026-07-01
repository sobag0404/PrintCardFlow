// PrintCardFlow — Step "Scan": review detected arts.
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCheck,
  FileSearch,
  ListChecks,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useWizardStore } from "@/lib/store/wizard-store";
import { pluralRu } from "@/lib/domain/validation";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { EmptyState } from "@/components/shared/empty-state";
import { StepHeading } from "./step-heading";
import { StepContainer, WizardFooterNav } from "./wizard-footer-nav";

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
      <div className="pcf-stat-number mt-1 text-2xl font-bold tabular-nums">
        <AnimatedNumber value={value} />
      </div>
    </div>
  );
}

export function StepScan() {
  const arts = useWizardStore((s) => s.arts);
  const toggleSelect = useWizardStore((s) => s.toggleSelect);
  const selectMany = useWizardStore((s) => s.selectMany);
  const invertSelection = useWizardStore((s) => s.invertSelection);
  const removeArt = useWizardStore((s) => s.removeArt);
  const removeSelected = useWizardStore((s) => s.removeSelected);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return arts;
    return arts.filter((a) => a.artName.toLowerCase().includes(q));
  }, [arts, query]);

  const selectedCount = arts.filter((a) => a.selected).length;
  const visibleSelectedCount = filtered.filter((a) => a.selected).length;
  const allVisibleSelected = filtered.length > 0 && filtered.every((a) => a.selected);
  const visibleSelectionState =
    allVisibleSelected ? true : visibleSelectedCount > 0 ? "indeterminate" : false;

  const selectVisible = (value: boolean) => {
    selectMany(filtered.map((a) => a.id), value);
  };

  const onRemoveSelected = () => {
    if (selectedCount === 0) return;
    removeSelected();
    pushToast({
      variant: "default",
      title: `Удалено: ${selectedCount}`,
    });
  };

  return (
    <StepContainer>
      <StepHeading
        icon={FileSearch}
        title="Сканирование"
        subtitle="Проверьте список обнаруженных артов перед назначением пресетов."
        accent="rose"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MiniStat
          label="Всего артов"
          value={arts.length}
          accent="pcf-accent-rose"
        />
        <MiniStat
          label="Выбрано"
          value={selectedCount}
          accent="pcf-accent-amber"
        />
        <MiniStat
          label="Отфильтровано"
          value={filtered.length}
          accent="pcf-accent-violet"
        />
      </div>

      {/* Toolbar */}
      <div className="pcf-toolbar flex flex-wrap items-center gap-2 rounded-lg border bg-card/50 p-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени арта…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 pl-8"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Очистить поиск"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => selectVisible(!allVisibleSelected)}
          className="h-8"
        >
          <CheckCheck className="size-3.5" />
          {allVisibleSelected ? "Снять видимые" : "Выбрать видимые"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => invertSelection()}
          className="h-8"
        >
          Инвертировать
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRemoveSelected}
          disabled={selectedCount === 0}
          className="h-8 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
        >
          <Trash2 className="size-3.5" />
          Удалить выбранные ({selectedCount})
        </Button>
      </div>

      {/* List */}
      <div className="rounded-xl border bg-card/40">
        <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <ListChecks className="size-3.5" />
          <Checkbox
            checked={visibleSelectionState}
            onCheckedChange={(checked) => selectVisible(checked === true)}
            aria-label="Выбрать все видимые арты"
            className="data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
          />
          Список артов
          <Badge variant="secondary" className="ml-auto">
            {filtered.length} {pluralRu(filtered.length, ["арт", "арта", "артов"])}
          </Badge>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title={arts.length === 0 ? "Список пуст" : "Ничего не найдено"}
            description={
              arts.length === 0
                ? "Вернитесь на шаг «Папка» и отсканируйте папку или импортируйте Excel."
                : "Попробуйте изменить поисковый запрос."
            }
            accent="rose"
            className="m-3"
          />
        ) : (
          <div className="max-h-[60vh] overflow-y-auto scroll-pcf p-1">
            <AnimatePresence initial={false}>
              {filtered.map((art) => (
                <motion.div
                  key={art.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/40"
                >
                  <Checkbox
                    checked={art.selected}
                    onCheckedChange={() => toggleSelect(art.id)}
                    aria-label={`Выбрать ${art.artName}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate pcf-mono text-sm font-medium">
                      {art.artName}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {art.source}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                    onClick={() => {
                      removeArt(art.id);
                      pushToast({
                        variant: "default",
                        title: "Удалено",
                        description: art.artName,
                      });
                    }}
                    aria-label={`Удалить ${art.artName}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <WizardFooterNav
        prevLabel="К папке"
        nextLabel="К пресетам"
        nextDisabled={arts.length === 0}
      />
    </StepContainer>
  );
}
