// PrintCardFlow — Step "Export": summary + primary cards + quick formats + history.
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  FileArchive,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Download,
  Package,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useWizardStore } from "@/lib/store/wizard-store";
import { usePreferencesStore } from "@/lib/store/preferences-store";
import { skuStats } from "@/lib/domain/sku-generator";
import {
  triggerCsvExport,
  triggerExcelExport,
  triggerJsonExport,
  triggerTxtExport,
  triggerZipExport,
} from "./export-handlers";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { ExportHistoryPanel } from "@/components/shared/export-history-panel";
import { cn } from "@/lib/utils";
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

function PrimaryExportCard({
  icon: Icon,
  title,
  description,
  accent,
  format,
  accentTile,
  onExport,
}: {
  icon: typeof FileSpreadsheet;
  title: string;
  description: string;
  accent: "emerald" | "violet";
  format: string;
  accentTile: string;
  onExport: () => Promise<void>;
}) {
  const [loading, setLoading] = React.useState(false);
  const handle = async () => {
    setLoading(true);
    try {
      await onExport();
    } finally {
      setLoading(false);
    }
  };
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="pcf-card-hover group rounded-xl border bg-card/60 p-5"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-xl",
            accentTile,
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{title}</h3>
            <Badge variant="outline" className="text-[10px] pcf-mono">
              {format}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button
        onClick={handle}
        disabled={loading}
        className={cn(
          "mt-4 w-full",
          accent === "emerald"
            ? "bg-emerald-500 text-white hover:bg-emerald-600"
            : "bg-violet-500 text-white hover:bg-violet-600",
        )}
      >
        <Download className="size-4" />
        {loading ? "Экспорт…" : "Скачать"}
      </Button>
    </motion.div>
  );
}

function QuickExportButton({
  icon: Icon,
  label,
  format,
  accentClass,
  borderClass,
  onExport,
}: {
  icon: typeof FileSpreadsheet;
  label: string;
  format: string;
  accentClass: string;
  borderClass: string;
  onExport: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const handle = async () => {
    setLoading(true);
    try {
      onExport();
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-card/50 p-3 text-left transition-all hover:shadow-md disabled:opacity-50",
        borderClass,
      )}
    >
      <div className={cn("grid size-9 place-items-center rounded-md", accentClass)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="pcf-mono text-[10px] text-muted-foreground">{format}</div>
      </div>
      <Download className="size-3.5 text-muted-foreground" />
    </button>
  );
}

export function StepExport() {
  const arts = useWizardStore((s) => s.arts);
  const presets = useWizardStore((s) => s.presets);
  const resetProject = useWizardStore((s) => s.resetProject);
  const exportProgress = useWizardStore((s) => s.exportProgress);
  const exportStatus = useWizardStore((s) => s.exportStatus);
  const pushToast = useWizardStore((s) => s.pushToast);

  const defaultIncludeManifest = usePreferencesStore(
    (s) => s.defaultIncludeManifest,
  );
  const [includeManifest, setIncludeManifest] = React.useState(
    defaultIncludeManifest,
  );

  const stats = React.useMemo(() => skuStats(arts), [arts]);

  const onZip = () => triggerZipExport({ includeManifest });

  return (
    <StepContainer>
      <StepHeading
        icon={Package}
        title="Экспорт"
        subtitle="Скачайте готовый реестр в нужном формате. Все экспорты логируются в историю."
        accent="violet"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Артов" value={stats.arts} accent="pcf-accent-violet" />
        <MiniStat label="С пресетом" value={stats.assigned} accent="pcf-accent-emerald" />
        <MiniStat label="Всего SKU" value={stats.totalSkus} accent="pcf-accent-amber" />
        <MiniStat label="Пресетов" value={presets.length} accent="pcf-accent-rose" />
      </div>

      {/* Progress bar */}
      {exportProgress > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-lg border bg-card/50 p-3"
        >
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium">{exportStatus || "Экспорт…"}</span>
            <span className="tabular-nums text-muted-foreground">
              {Math.round(exportProgress)}%
            </span>
          </div>
          <Progress value={exportProgress} className="h-1.5" />
        </motion.div>
      )}

      {/* Primary export cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <PrimaryExportCard
          icon={FileSpreadsheet}
          title="Excel"
          description="Полный реестр SKU с заголовком, автофильтром и зафиксированной шапкой."
          accent="emerald"
          format=".xlsx"
          accentTile="pcf-accent-emerald"
          onExport={triggerExcelExport}
        />
        <PrimaryExportCard
          icon={FileArchive}
          title="ZIP-архив"
          description="Все форматы + manifest.json + README.txt в одном архиве."
          accent="violet"
          format=".zip"
          accentTile="pcf-accent-violet"
          onExport={onZip}
        />
      </div>

      {/* Manifest checkbox */}
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={includeManifest}
          onCheckedChange={(v) => setIncludeManifest(v === true)}
        />
        <span>Включить manifest.json в ZIP</span>
      </label>

      {/* Quick formats */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <FileCode className="size-4 text-muted-foreground" />
          <h3 className="pcf-section-label">Дополнительные форматы</h3>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <QuickExportButton
            icon={FileSpreadsheet}
            label="CSV"
            format=".csv"
            accentClass="pcf-accent-emerald"
            borderClass="border-emerald-500/40"
            onExport={triggerCsvExport}
          />
          <QuickExportButton
            icon={FileJson}
            label="JSON"
            format=".json"
            accentClass="pcf-accent-amber"
            borderClass="border-amber-500/40"
            onExport={triggerJsonExport}
          />
          <QuickExportButton
            icon={FileText}
            label="TXT-сводка"
            format=".txt"
            accentClass="pcf-accent-violet"
            borderClass="border-violet-500/40"
            onExport={triggerTxtExport}
          />
        </div>
      </section>

      {/* Export history */}
      <ExportHistoryPanel />

      <WizardFooterNav
        prevLabel="К просмотру"
        rightExtra={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400">
                <RotateCcw className="size-4" />
                Начать заново
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Начать новый проект?</AlertDialogTitle>
                <AlertDialogDescription>
                  Текущий проект и список артов будут очищены. Сохранённые сессии и история экспортов не пострадают.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-500 text-white hover:bg-rose-600"
                  onClick={() => {
                    resetProject();
                    pushToast({
                      variant: "default",
                      title: "Проект сброшен",
                    });
                  }}
                >
                  Да, начать заново
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />
    </StepContainer>
  );
}
