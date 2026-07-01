// PrintCardFlow — Search & Replace dialog for art names.
"use client";

import * as React from "react";
import { Replace, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWizardStore } from "@/lib/store/wizard-store";

interface SearchReplaceDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function SearchReplaceDialog({ open, onOpenChange }: SearchReplaceDialogProps) {
  const arts = useWizardStore((s) => s.arts);
  const searchReplaceArts = useWizardStore((s) => s.searchReplaceArts);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [search, setSearch] = React.useState("");
  const [replace, setReplace] = React.useState("");
  const [scope, setScope] = React.useState<"all" | "selected">("all");
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [exactMatch, setExactMatch] = React.useState(false);

  React.useEffect(() => {
    if (open) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setSearch("");
      setReplace("");
      setScope("all");
      setCaseSensitive(false);
      setExactMatch(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Compute live preview (first 5 matches + total count).
  const { matches, totalCount } = React.useMemo(() => {
    if (!search) return { matches: [] as { id: string; from: string; to: string }[], totalCount: 0 };
    try {
      const flags = caseSensitive ? "g" : "gi";
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = exactMatch
        ? new RegExp(`^${escaped}$`, flags)
        : new RegExp(escaped, flags);
      const list: { id: string; from: string; to: string }[] = [];
      let count = 0;
      for (const a of arts) {
        if (scope === "selected" && !a.selected) continue;
        const newName = a.artName.replace(pattern, replace);
        if (newName !== a.artName) {
          count += 1;
          if (list.length < 5) {
            list.push({ id: a.id, from: a.artName, to: newName });
          }
        }
      }
      return { matches: list, totalCount: count };
    } catch {
      return { matches: [], totalCount: 0 };
    }
  }, [search, replace, scope, caseSensitive, exactMatch, arts]);

  const onReplaceAll = () => {
    if (!search) {
      pushToast({ variant: "warning", title: "Введите текст для поиска" });
      return;
    }
    const count = searchReplaceArts(search, replace, {
      scope,
      caseSensitive,
      exactMatch,
    });
    if (count > 0) {
      pushToast({
        variant: "success",
        title: `Заменено: ${count}`,
        description: `«${search}» → «${replace}»`,
      });
      onOpenChange(false);
    } else {
      pushToast({
        variant: "warning",
        title: "Совпадений не найдено",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Replace className="size-4" />
            Поиск и замена
          </DialogTitle>
          <DialogDescription>
            Массовая замена в именах артов. История изменений доступна через отмену (Ctrl+Z).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="sr-find">Найти</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="sr-find"
                className="pcf-mono pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="например, roses_red"
                autoFocus
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sr-replace">Заменить на</Label>
            <Input
              id="sr-replace"
              className="pcf-mono"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="например, roses_pink"
            />
          </div>

          <div className="grid gap-2">
            <Label>Область</Label>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as "all" | "selected")}
              className="grid grid-cols-2 gap-2"
            >
              <Label
                htmlFor="sr-all"
                className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent/50"
              >
                <RadioGroupItem id="sr-all" value="all" />
                Все арты ({arts.length})
              </Label>
              <Label
                htmlFor="sr-sel"
                className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent/50"
              >
                <RadioGroupItem id="sr-sel" value="selected" />
                Только выбранные ({arts.filter((a) => a.selected).length})
              </Label>
            </RadioGroup>
          </div>

          <div className="flex flex-wrap gap-4">
            <Label
              htmlFor="sr-case"
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                id="sr-case"
                checked={caseSensitive}
                onCheckedChange={(v) => setCaseSensitive(v === true)}
              />
              С учётом регистра
            </Label>
            <Label
              htmlFor="sr-exact"
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                id="sr-exact"
                checked={exactMatch}
                onCheckedChange={(v) => setExactMatch(v === true)}
              />
              Точное совпадение
            </Label>
          </div>

          {/* Live preview */}
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">
              Предпросмотр · найдено: {totalCount}
            </div>
            {matches.length === 0 ? (
              <div className="text-xs text-muted-foreground italic">
                {search ? "Совпадений не найдено" : "Введите текст для поиска"}
              </div>
            ) : (
              <ul className="space-y-1">
                {matches.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 text-xs">
                    <code className="rounded bg-rose-500/10 px-1.5 py-0.5 pcf-mono text-rose-600 dark:text-rose-400 line-through">
                      {m.from}
                    </code>
                    <span className="text-muted-foreground">→</span>
                    <code className="rounded bg-emerald-500/10 px-1.5 py-0.5 pcf-mono text-emerald-600 dark:text-emerald-400">
                      {m.to}
                    </code>
                  </li>
                ))}
                {totalCount > matches.length && (
                  <li className="text-xs text-muted-foreground italic">
                    …и ещё {totalCount - matches.length}
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onReplaceAll} disabled={!search || totalCount === 0}>
            <Replace className="size-4" />
            Заменить все ({totalCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
