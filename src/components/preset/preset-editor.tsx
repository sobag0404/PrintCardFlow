// PrintCardFlow — PresetEditor (Dialog with full preset form).
"use client";

import * as React from "react";
import {
  BedDouble,
  Circle,
  Crown,
  Download,
  Layers,
  Plus,
  Rows3,
  Settings2,
  Sparkles,
  Square,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWizardStore } from "@/lib/store/wizard-store";
import type { Preset, PresetKind, SizeEntry } from "@/lib/domain/types";
import { BUILTIN_PRESETS } from "@/lib/domain/presets";
import {
  downloadPresetTemplate,
  readPresetTemplateFile,
} from "./preset-template-io";
import { PresetChip } from "./preset-chip";
import { cn } from "@/lib/utils";

const ACCENTS = [
  { value: "amber", label: "Янтарь" },
  { value: "rose", label: "Роза" },
  { value: "pink", label: "Розовый" },
  { value: "fuchsia", label: "Фуксия" },
  { value: "emerald", label: "Изумруд" },
  { value: "violet", label: "Фиолет" },
] as const;

const ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "BedDouble", icon: BedDouble },
  { name: "Square", icon: Square },
  { name: "Layers", icon: Layers },
  { name: "Rows3", icon: Rows3 },
  { name: "Circle", icon: Circle },
  { name: "Settings2", icon: Settings2 },
  { name: "Sparkles", icon: Sparkles },
  { name: "Crown", icon: Crown },
];

const KIND_OPTIONS: { value: PresetKind; label: string }[] = [
  { value: "blanket", label: "Одеяло" },
  { value: "pillow-nav", label: "Подушка-НАВ" },
  { value: "pillow-multi", label: "Подушка-МУЛЬТИ" },
  { value: "pillow-sizes", label: "Подушка-РАЗМЕРЫ" },
  { value: "single", label: "Одиночный" },
  { value: "custom", label: "Свой" },
];

const ACCENT_DOT: Record<string, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  pink: "bg-pink-500",
  fuchsia: "bg-fuchsia-500",
  emerald: "bg-emerald-500",
  violet: "bg-violet-500",
};

export interface PresetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing preset to edit. null = create new. */
  preset?: Preset | null;
}

function makeNewPreset(): Preset {
  return {
    id: `preset-user-${Date.now().toString(36)}`,
    kind: "custom",
    name: "",
    description: "",
    material: "",
    category: "",
    sizes: [{ label: "ONE", seqScope: "custom" }],
    ipEnabledDefault: false,
    accent: "violet",
    icon: "Settings2",
  };
}

export function PresetEditor({ open, onOpenChange, preset }: PresetEditorProps) {
  const upsertPreset = useWizardStore((s) => s.upsertPreset);
  const removePreset = useWizardStore((s) => s.removePreset);
  const setPresets = useWizardStore((s) => s.setPresets);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [draft, setDraft] = React.useState<Preset>(preset ?? makeNewPreset());
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Reset draft whenever dialog opens (with new preset or null).
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setDraft(preset ? { ...preset } : makeNewPreset());
      setErrors({});
    });

    return () => {
      cancelled = true;
    };
  }, [open, preset]);

  const isBuiltin = React.useMemo(
    () => BUILTIN_PRESETS.some((p) => p.id === draft.id),
    [draft.id],
  );

  const update = (patch: Partial<Preset>) => {
    setDraft((d) => ({ ...d, ...patch }));
  };

  const addSize = () => {
    update({
      sizes: [...draft.sizes, { label: "", seqScope: draft.kind || "custom" }],
    });
  };

  const removeSize = (index: number) => {
    update({ sizes: draft.sizes.filter((_, i) => i !== index) });
  };

  const updateSize = (index: number, patch: Partial<SizeEntry>) => {
    update({
      sizes: draft.sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "Название обязательно";
    if (draft.sizes.length === 0) next.sizes = "Должен быть хотя бы один размер";
    draft.sizes.forEach((s, i) => {
      if (!s.label.trim()) next[`size-${i}-label`] = "Метка обязательна";
      if (!s.seqScope.trim()) next[`size-${i}-scope`] = "Scope обязателен";
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      pushToast({ variant: "error", title: "Проверьте поля формы" });
      return;
    }
    upsertPreset(draft);
    pushToast({
      variant: "success",
      title: preset ? "Пресет обновлён" : "Пресет создан",
      description: draft.name,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    removePreset(draft.id);
    pushToast({ variant: "default", title: "Пресет удалён", description: draft.name });
    onOpenChange(false);
  };

  const handleExport = () => {
    try {
      downloadPresetTemplate([draft], `${draft.name || "preset"}.json`);
      pushToast({ variant: "success", title: "Шаблон экспортирован" });
    } catch (e) {
      pushToast({
        variant: "error",
        title: "Ошибка экспорта",
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const bundle = await readPresetTemplateFile(file);
      // Merge imported presets into existing ones (replacing by id).
      const existing = useWizardStore.getState().presets;
      const map = new Map<string, Preset>(existing.map((p) => [p.id, p]));
      for (const p of bundle.presets) map.set(p.id, p);
      setPresets(Array.from(map.values()));
      pushToast({
        variant: "success",
        title: "Импортировано пресетов",
        description: String(bundle.presets.length),
      });
      onOpenChange(false);
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Ошибка импорта",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      // Reset input so the same file can be picked again.
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const IconPreview = ICON_OPTIONS.find((i) => i.name === draft.icon)?.icon ?? ICON_OPTIONS[0].icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scroll-pcf">
        <DialogHeader>
          <DialogTitle>
            {preset ? "Редактировать пресет" : "Создать пресет"}
          </DialogTitle>
          <DialogDescription>
            Настройте вид, материал, категорию, размеры и поведение IP-кода.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name + Kind */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="preset-name">
                Название <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="preset-name"
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Например, Одеяло Флис"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <span className="text-xs text-rose-500">{errors.name}</span>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="preset-kind">Тип пресета</Label>
              <Select
                value={draft.kind}
                onValueChange={(v) => update({ kind: v as PresetKind })}
              >
                <SelectTrigger id="preset-kind" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="preset-desc">Описание</Label>
            <Textarea
              id="preset-desc"
              value={draft.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Краткое описание назначения пресета"
              rows={2}
            />
          </div>

          {/* Material + Category */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="preset-material">Материал</Label>
              <Input
                id="preset-material"
                value={draft.material}
                onChange={(e) => update({ material: e.target.value })}
                placeholder="Флис, Сатин, Хлопок…"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="preset-category">Категория</Label>
              <Input
                id="preset-category"
                value={draft.category}
                onChange={(e) => update({ category: e.target.value })}
                placeholder="Одеяло, Подушка, Одиночный…"
                className="pcf-mono"
              />
            </div>
          </div>

          {/* Accent + Icon */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Акцент</Label>
              <Select
                value={draft.accent}
                onValueChange={(v) => update({ accent: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          ACCENT_DOT[draft.accent],
                        )}
                      />
                      {ACCENTS.find((a) => a.value === draft.accent)?.label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ACCENTS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            ACCENT_DOT[a.value],
                          )}
                        />
                        {a.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Иконка</Label>
              <Select
                value={draft.icon}
                onValueChange={(v) => update({ icon: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      <IconPreview className="size-3.5" />
                      {draft.icon}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => {
                    const I = opt.icon;
                    return (
                      <SelectItem key={opt.name} value={opt.name}>
                        <span className="flex items-center gap-1.5">
                          <I className="size-3.5" />
                          {opt.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* IP Switch */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <Label htmlFor="preset-ip" className="text-sm font-medium">
                IP-код по умолчанию
              </Label>
              <p className="text-xs text-muted-foreground">
                Включать IP-сегмент (БТ) в SKU новых артов этого пресета.
              </p>
            </div>
            <Switch
              id="preset-ip"
              checked={draft.ipEnabledDefault}
              onCheckedChange={(v) => update({ ipEnabledDefault: v })}
            />
          </div>

          {/* Sizes editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Размеры <span className="text-rose-500">*</span>
              </Label>
              <Button variant="outline" size="sm" className="h-7" onClick={addSize}>
                <Plus className="size-3.5" />
                Добавить
              </Button>
            </div>
            {errors.sizes && (
              <span className="text-xs text-rose-500">{errors.sizes}</span>
            )}
            <div className="space-y-1.5">
              {draft.sizes.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_28px] items-center gap-2"
                >
                  <Input
                    value={s.label}
                    onChange={(e) => updateSize(i, { label: e.target.value })}
                    placeholder="Метка (50x70, ONE…)"
                    className="h-8 pcf-mono"
                    aria-label={`Размер ${i + 1} метка`}
                    aria-invalid={!!errors[`size-${i}-label`]}
                  />
                  <Input
                    value={s.seqScope}
                    onChange={(e) => updateSize(i, { seqScope: e.target.value })}
                    placeholder="seqScope (pillow-nav, custom…)"
                    className="h-8 pcf-mono text-xs"
                    aria-label={`Размер ${i + 1} scope`}
                    aria-invalid={!!errors[`size-${i}-scope`]}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                    onClick={() => removeSize(i)}
                    aria-label="Удалить размер"
                    disabled={draft.sizes.length <= 1}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Предпросмотр
            </div>
            <div className="max-w-[240px]">
              <PresetChip preset={draft} editable={false} onClick={() => {}} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: import/export + delete */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={handleExport}
              aria-label="Экспорт шаблона"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Экспорт</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={handleImportClick}
              aria-label="Импорт шаблона"
            >
              <Upload className="size-3.5" />
              <span className="hidden sm:inline">Импорт</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
              aria-hidden
            />
            {!isBuiltin && preset && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                    aria-label="Удалить пресет"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="hidden sm:inline">Удалить</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Удалить пресет «{draft.name}»?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Арты с этим пресетом будут отвязаны. Действие необратимо.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-600 hover:bg-rose-700"
                      onClick={handleDelete}
                    >
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Right: cancel + save */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button
              className="bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 text-white hover:opacity-90"
              onClick={handleSave}
            >
              Сохранить
            </Button>
          </div>
        </DialogFooter>

        {/* Hidden badge for builtin presets (informational) */}
        {isBuiltin && (
          <Badge
            variant="outline"
            className="absolute right-4 top-4 border-amber-500/40 text-amber-600 dark:text-amber-400"
          >
            встроенный
          </Badge>
        )}
      </DialogContent>
    </Dialog>
  );
}
