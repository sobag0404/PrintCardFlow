// PrintCardFlow — Settings dialog (controlled by preferences store).
"use client";

import * as React from "react";
import { RefreshCw, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreferencesStore, type ExportFormat, type ThemePreference } from "@/lib/store/preferences-store";
import { renderFilenameTemplate, formatDateStamp, formatTimeStamp, type FilenameContext } from "@/lib/export/filename-template";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  excel: "Excel (.xlsx)",
  zip: "ZIP-архив (.zip)",
  csv: "CSV (.csv)",
  json: "JSON (.json)",
  txt: "TXT-сводка (.txt)",
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const prefs = usePreferencesStore();
  const [confirmReset, setConfirmReset] = React.useState(false);

  const preview = React.useMemo(() => {
    try {
      const ctx: FilenameContext = {
        project: "МойПроект",
        date: formatDateStamp(),
        time: formatTimeStamp(),
        count: 42,
      };
      return `${renderFilenameTemplate(prefs.filenameTemplate, ctx)}.xlsx`;
    } catch {
      return "(ошибка шаблона)";
    }
  }, [prefs.filenameTemplate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto scroll-pcf">
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
          <DialogDescription>
            Настройки сохраняются локально в браузере.
          </DialogDescription>
        </DialogHeader>

        {/* Экспорт */}
        <section className="space-y-4">
          <h3 className="pcf-section-label">Экспорт</h3>
          <div className="grid gap-2">
            <Label htmlFor="set-fmt">Формат по умолчанию</Label>
            <Select
              value={prefs.defaultExportFormat}
              onValueChange={(v) => prefs.setDefaultExportFormat(v as ExportFormat)}
            >
              <SelectTrigger id="set-fmt" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {FORMAT_LABELS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="set-tpl">Шаблон имени файла</Label>
            <Input
              id="set-tpl"
              className="pcf-mono"
              value={prefs.filenameTemplate}
              onChange={(e) => prefs.setFilenameTemplate(e.target.value)}
              placeholder="{project}_SKU_{date}_{time}"
            />
            <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-0.5 pcf-mono">{"{project}"}</code>
              <code className="rounded bg-muted px-1.5 py-0.5 pcf-mono">{"{date}"}</code>
              <code className="rounded bg-muted px-1.5 py-0.5 pcf-mono">{"{time}"}</code>
              <code className="rounded bg-muted px-1.5 py-0.5 pcf-mono">{"{count}"}</code>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Предпросмотр: </span>
              <span className="pcf-mono font-medium">{preview}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Автологирование экспортов</div>
              <div className="text-xs text-muted-foreground">Сохранять историю экспортов</div>
            </div>
            <Switch
              checked={prefs.autoLogExports}
              onCheckedChange={prefs.setAutoLogExports}
              aria-label="Автологирование экспортов"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Toast-уведомления</div>
              <div className="text-xs text-muted-foreground">Показывать всплывашки при экспорте</div>
            </div>
            <Switch
              checked={prefs.showExportToast}
              onCheckedChange={prefs.setShowExportToast}
              aria-label="Toast-уведомления"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
            <div>
              <div className="text-sm font-medium">Манифест по умолчанию</div>
              <div className="text-xs text-muted-foreground">Включать manifest.json в ZIP</div>
            </div>
            <Switch
              checked={prefs.defaultIncludeManifest}
              onCheckedChange={prefs.setDefaultIncludeManifest}
              aria-label="Манифест по умолчанию"
            />
          </div>
        </section>

        {/* Внешний вид */}
        <section className="space-y-3">
          <h3 className="pcf-section-label">Внешний вид</h3>
          <RadioGroup
            value={prefs.themePreference}
            onValueChange={(v) => prefs.setThemePreference(v as ThemePreference)}
            className="grid grid-cols-3 gap-2"
          >
            {(["light", "dark", "system"] as ThemePreference[]).map((t) => (
              <Label
                key={t}
                htmlFor={`theme-${t}`}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-all hover:bg-accent/50",
                  prefs.themePreference === t && "border-foreground/40 bg-accent",
                )}
              >
                <RadioGroupItem id={`theme-${t}`} value={t} className="sr-only" />
                <span className="font-medium">
                  {t === "light" ? "Светлая" : t === "dark" ? "Тёмная" : "Системная"}
                </span>
              </Label>
            ))}
          </RadioGroup>
          <p className="text-[11px] text-muted-foreground">
            Сегодня {formatDateStamp()} · {formatTimeStamp()}
          </p>
        </section>

        {/* Сброс */}
        <section className="space-y-3">
          <h3 className="pcf-section-label text-rose-500">Сброс</h3>
          {confirmReset ? (
            <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3 space-y-3">
              <p className="text-sm">Сбросить все настройки к значениям по умолчанию?</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    prefs.resetToDefaults();
                    setConfirmReset(false);
                  }}
                >
                  <RotateCcw className="size-3.5" />
                  Да, сбросить
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-rose-500/40 text-rose-600 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400"
              onClick={() => setConfirmReset(true)}
            >
              <RefreshCw className="size-3.5" />
              Сбросить настройки
            </Button>
          )}
        </section>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Готово</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
