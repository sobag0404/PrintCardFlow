// PrintCardFlow — Export history panel (collapsible).
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileJson,
  History,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useWizardStore } from "@/lib/store/wizard-store";
import { pluralRu } from "@/lib/domain/validation";
import { HistoryItemSkeleton } from "./skeletons";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

interface HistoryRecord {
  id: string;
  kind: string;
  projectName: string;
  fileName: string;
  fileSize: number;
  artsCount: number;
  skuCount: number;
  presetCount: number;
  includeManifest: boolean;
  createdAt: string;
}

const KIND_ICON: Record<string, typeof FileSpreadsheet> = {
  excel: FileSpreadsheet,
  zip: FileArchive,
  csv: FileSpreadsheet,
  json: FileJson,
  txt: FileText,
};

const KIND_COLOR: Record<string, string> = {
  excel: "text-emerald-500 bg-emerald-500/10",
  zip: "text-violet-500 bg-violet-500/10",
  csv: "text-emerald-500 bg-emerald-500/10",
  json: "text-amber-500 bg-amber-500/10",
  txt: "text-violet-500 bg-violet-500/10",
};

const KIND_LABEL: Record<string, string> = {
  excel: "Excel",
  zip: "ZIP",
  csv: "CSV",
  json: "JSON",
  txt: "TXT",
};

function formatSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(2)} МБ`;
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return "только что";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин назад`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч назад`;
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} дн назад`;
    return new Date(iso).toLocaleDateString("ru-RU");
  } catch {
    return iso;
  }
}

export function ExportHistoryPanel() {
  const pushToast = useWizardStore((s) => s.pushToast);
  const [open, setOpen] = React.useState(false);
  const [records, setRecords] = React.useState<HistoryRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/export-history");
      const data = await res.json();
      setRecords(data.records ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open && records.length === 0 && !loading) void refresh();
  }, [open, records.length, loading, refresh]);

  const onRedownload = async (r: HistoryRecord) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/export-history/${r.id}/redownload`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.fileName || `export.${r.kind === "excel" ? "xlsx" : r.kind}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      pushToast({
        variant: "success",
        title: "Файл скачан",
        description: r.fileName,
      });
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Ошибка скачивания",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (r: HistoryRecord) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/export-history/${r.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRecords((prev) => prev.filter((x) => x.id !== r.id));
      pushToast({ variant: "default", title: "Запись удалена" });
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Ошибка удаления",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl border border-border/70 bg-card/50"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 p-4 text-left pcf-focus rounded-xl"
          aria-expanded={open}
        >
          <div className="grid size-9 place-items-center rounded-md bg-violet-500/10 text-violet-500">
            <History className="size-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">История экспортов</div>
            <div className="text-xs text-muted-foreground">
              {records.length > 0
                ? `${records.length} ${pluralRu(records.length, ["запись", "записи", "записей"])}`
                : "Скачанные файлы появятся здесь"}
            </div>
          </div>
          {records.length > 0 && (
            <Badge variant="secondary">{records.length}</Badge>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground"
          >
            <ChevronDown className="size-4" />
          </motion.span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pcf-divider" />
        <div className="p-3">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <HistoryItemSkeleton key={i} />
              ))}
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={FileCode}
              title="История пуста"
              description="После первого экспорта здесь появится список файлов для повторного скачивания."
              accent="violet"
              bare
              className="py-6"
            />
          ) : (
            <ul className="space-y-1.5 max-h-72 overflow-y-auto scroll-pcf">
              <AnimatePresence initial={false}>
                {records.map((r) => {
                  const Icon = KIND_ICON[r.kind] ?? FileText;
                  return (
                    <motion.li
                      key={r.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2.5 rounded-md border bg-background/60 p-2"
                    >
                      <div
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded",
                          KIND_COLOR[r.kind] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate pcf-mono text-xs font-medium">
                              {r.fileName}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>{r.fileName}</TooltipContent>
                        </Tooltip>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                            {KIND_LABEL[r.kind] ?? r.kind}
                          </Badge>
                          <span>{r.artsCount} арт · {r.skuCount} SKU</span>
                          <span>· {formatSize(r.fileSize)}</span>
                          <span>· {formatRelative(r.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              disabled={busyId === r.id}
                              onClick={() => onRedownload(r)}
                              aria-label="Скачать снова"
                            >
                              {busyId === r.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Download className="size-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Скачать снова</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                              disabled={busyId === r.id}
                              onClick={() => onDelete(r)}
                              aria-label="Удалить запись"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Удалить запись</TooltipContent>
                        </Tooltip>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
