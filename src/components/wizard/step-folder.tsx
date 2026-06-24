// PrintCardFlow — Step "Folder": scan or import.
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  FolderSearch,
  ScanLine,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { LoadingButton } from "@/components/shared/loading-button";
import { useWizardStore } from "@/lib/store/wizard-store";
import { DEMO_BASE_PATHS } from "@/lib/domain/demo-data";
import type { Art } from "@/lib/domain/types";
import {
  isElectron,
  scanFolder as electronScan,
  pickFolder as electronPick,
} from "@/lib/electron/electron-client";
import { Folder } from "lucide-react";
import { StepHeading } from "./step-heading";
import { StepContainer, WizardFooterNav } from "./wizard-footer-nav";

const COUNT_OPTIONS = [10, 30, 50, 100, 200];

interface DetectedColumn {
  key: string;
  label: string;
  count: number;
}

export function StepFolder() {
  const setArts = useWizardStore((s) => s.setArts);
  const startProject = useWizardStore((s) => s.startProject);
  const next = useWizardStore((s) => s.next);
  const pushToast = useWizardStore((s) => s.pushToast);
  const project = useWizardStore((s) => s.project);

  const [electronMode] = React.useState(() => isElectron());
  const [basePath, setBasePath] = React.useState(
    project?.basePath || (electronMode ? "" : DEMO_BASE_PATHS[0]),
  );
  const [count, setCount] = React.useState(30);
  const [scanning, setScanning] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [detectedColumns, setDetectedColumns] = React.useState<
    DetectedColumn[] | null
  >(null);
  const [warnings, setWarnings] = React.useState<string[]>([]);
  const [colsOpen, setColsOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onPickFolder = async () => {
    const picked = await electronPick();
    if (picked) setBasePath(picked);
  };

  const onScan = async () => {
    setScanning(true);
    try {
      if (electronMode) {
        const result = await electronScan(basePath, count);
        if (!result.ok) throw new Error(result.error || "scan failed");
        const arts = result.arts;
        setArts(arts);
        startProject(project?.name || "Новый проект", basePath);
        pushToast({ variant: "success", title: "Папка отсканирована", description: `Найдено: ${arts.length}` });
        next();
        return;
      }
      const res = await fetch("/api/scan-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basePath, count }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const arts: Art[] = data.arts ?? [];
      setArts(arts);
      startProject(project?.name || "Новый проект", basePath);
      pushToast({
        variant: "success",
        title: "Папка отсканирована",
        description: `Найдено артов: ${arts.length}`,
      });
      next();
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Ошибка сканирования",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setScanning(false);
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/excel-import", {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Map rows to arts.
      const rows: Record<string, unknown>[] = data.rows ?? [];
      const arts: Art[] = rows.map((row, i) => {
        const artName = String(
          row.artName ?? row.ArtName ?? row["Имя"] ?? row["Арт"] ?? `row_${i + 1}`,
        );
        const presetName = String(row.presetName ?? row.PresetName ?? row["Пресет"] ?? "");
        const material = String(row.material ?? row.Material ?? row["Материал"] ?? "");
        const category = String(row.category ?? row.Category ?? row["Категория"] ?? "");
        const ipCode = String(row.ip ?? row.IP ?? "").trim() as Art["ipCode"];
        return {
          id: `imp-${Date.now().toString(36)}-${i}`,
          artName,
          presetId: "",
          ipCode: ipCode || null,
          seqOverride: 0,
          material,
          category,
          sizes: null,
          computedSkus: [],
          selected: false,
          source: `import:${file.name}`,
          createdAt: Date.now() + i,
        };
      });
      setArts(arts);
      startProject(file.name.replace(/\.(xlsx|xls|csv)$/i, ""), `/import/${file.name}`);
      // Show detected columns preview.
      const dc: DetectedColumn[] = (data.detectedColumns ?? []).map(
        (c: { key: string; label: string; count: number }) => ({
          key: c.key,
          label: c.label,
          count: c.count,
        }),
      );
      setDetectedColumns(dc);
      setWarnings(data.warnings ?? []);
      setColsOpen(true);
      pushToast({
        variant: "success",
        title: "Файл импортирован",
        description: `Импортировано строк: ${arts.length}`,
      });
      next();
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Ошибка импорта",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <StepContainer>
      <StepHeading
        icon={FolderSearch}
        title="Источник артов"
        subtitle="Укажите папку для сканирования или загрузите существующий Excel-реестр."
        accent="amber"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        {/* Left: path + scan */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card/50 p-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="folder-path">Путь к папке</Label>
              <div className="flex gap-2">
                <Input
                  id="folder-path"
                  className="pcf-mono flex-1"
                  value={basePath}
                  onChange={(e) => setBasePath(e.target.value)}
                  placeholder="/Users/designer/PrintCards/2026_Spring"
                />
                {electronMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onPickFolder}
                    aria-label="Выбрать папку"
                    className="pcf-focus shrink-0"
                  >
                    <Folder className="size-4" />
                  </Button>
                )}
              </div>
              {!electronMode && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {DEMO_BASE_PATHS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setBasePath(p)}
                      className="rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    {p.split("/").pop() ?? p}
                  </button>
                ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="folder-count">
                {electronMode ? "Максимум артов" : "Количество артов (демо)"}
              </Label>
              <Select
                value={String(count)}
                onValueChange={(v) => setCount(Number(v))}
              >
                <SelectTrigger id="folder-count" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNT_OPTIONS.map((c) => (
                    <SelectItem key={c} value={String(c)}>
                      {c} артов
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <LoadingButton
              className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:opacity-90"
              loading={scanning}
              loadingText="Сканирование…"
              onClick={onScan}
            >
              <ScanLine className="size-4" />
              Сканировать папку
            </LoadingButton>
          </div>

          {/* Excel import */}
          <div className="rounded-xl border bg-card/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="size-4 text-emerald-500" />
              <h3 className="text-sm font-semibold">Импорт из Excel</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Загрузите .xlsx файл реестра. Поддерживаются колонки:{" "}
              <code className="rounded bg-muted px-1 py-0.5 pcf-mono text-[10px]">
                ArtName, PresetName, Material, Category, Size, IP
              </code>
              .
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={onFile}
              className="hidden"
              aria-hidden
            />
            <LoadingButton
              variant="outline"
              className="w-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
              loading={importing}
              loadingText="Импорт…"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" />
              Выбрать файл Excel
            </LoadingButton>
          </div>

          {/* Detected columns preview */}
          {detectedColumns && (
            <Collapsible
              open={colsOpen}
              onOpenChange={setColsOpen}
              className="rounded-xl border bg-card/50"
            >
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center gap-2 p-3 text-left text-sm font-medium pcf-focus">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Обнаруженные колонки ({detectedColumns.length})
                  <Badge variant="secondary" className="ml-auto">
                    {detectedColumns.length}
                  </Badge>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pcf-divider" />
                <div className="space-y-2 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {detectedColumns.map((c) => (
                      <Badge key={c.key} variant="outline" className="pcf-mono">
                        {c.label} · {c.count}
                      </Badge>
                    ))}
                  </div>
                  {warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {warnings.map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400"
                        >
                          <AlertCircle className="mt-0.5 size-3 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Right: tips */}
        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="space-y-3"
        >
          <div className="rounded-xl border bg-card/50 p-4">
            <h3 className="text-sm font-semibold">Как это работает</h3>
            <ol className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2">
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">1</span>
                Укажите путь к папке или импортируйте Excel.
              </li>
              <li className="flex gap-2">
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">2</span>
                Демо-режим сгенерирует фиктивные имена артов для теста.
              </li>
              <li className="flex gap-2">
                <span className="grid size-4 shrink-0 place-items-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-600 dark:text-amber-400">3</span>
                После сканирования можно отредактировать список артов.
              </li>
            </ol>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-2 text-xs">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div>
                <div className="font-semibold text-amber-600 dark:text-amber-400">
                  Веб-демо
                </div>
                <p className="mt-1 text-muted-foreground">
                  В браузере нет доступа к файловой системе. Реальное сканирование
                  доступно в desktop-сборке.
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      <WizardFooterNav
        prevLabel="К старту"
        nextLabel="Пропустить"
        nextDisabled={scanning || importing}
        onNext={() => next()}
      />
    </StepContainer>
  );
}
