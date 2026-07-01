// PrintCardFlow — Help dialog with shortcuts + SKU format explanation.
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWizardStore } from "@/lib/store/wizard-store";

interface ShortcutRow {
  keys: string[];
  label: string;
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: ["Alt", "→"], label: "Следующий шаг" },
  { keys: ["Alt", "←"], label: "Предыдущий шаг" },
  { keys: ["Ctrl", "Z"], label: "Отменить" },
  { keys: ["Ctrl", "Y"], label: "Повторить" },
  { keys: ["Ctrl", "Shift", "Z"], label: "Повторить (альтернатива)" },
  { keys: ["Ctrl", "/"], label: "Подсказки / горячие клавиши" },
  { keys: ["Ctrl", "S"], label: "Экспорт (формат по умолчанию)" },
  { keys: ["Ctrl", "E"], label: "Экспорт ZIP-архива" },
  { keys: ["Ctrl", "D"], label: "Дублировать выбранные" },
  { keys: ["Esc"], label: "Закрыть диалог" },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium pcf-mono shadow-[0_1px_0_rgb(0_0_0_/_0.1)]">
      {children}
    </kbd>
  );
}

export function HelpDialog() {
  const open = useWizardStore((s) => s.helpOpen);
  const setOpen = useWizardStore((s) => s.setHelpOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto scroll-pcf">
        <DialogHeader>
          <DialogTitle>Горячие клавиши и подсказки</DialogTitle>
          <DialogDescription>
            Используйте клавиатуру для быстрой навигации по мастеру.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="pcf-section-label">Клавиатурные сокращения</h3>
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {SHORTCUTS.map((s) => (
                  <tr key={s.label} className="hover:bg-accent/30">
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {s.keys.map((k, i) => (
                          <React.Fragment key={k}>
                            {i > 0 && <span className="text-muted-foreground text-[10px]">+</span>}
                            <Kbd>{k}</Kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {s.label}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="pcf-section-label">Формат SKU</h3>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
            <p className="mb-2">
              Каждая SKU собирается из шести сегментов, разделённых символом
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5 pcf-mono">_</code>:
            </p>
            <div className="rounded-md border bg-background p-3 text-center">
              <code className="text-xs sm:text-sm pcf-mono">
                <span className="text-amber-500">ArtName</span>
                <span className="text-muted-foreground">_</span>
                <span className="text-rose-500">SeqNum</span>
                <span className="text-muted-foreground">_</span>
                <span className="text-pink-500">Size</span>
                <span className="text-muted-foreground">_</span>
                <span className="text-fuchsia-500">Material</span>
                <span className="text-muted-foreground">_</span>
                <span className="text-emerald-500">Category</span>
                <span className="text-muted-foreground">_</span>
                <span className="text-violet-500">IP</span>
              </code>
            </div>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>
                <b className="text-foreground">ArtName</b> — имя арта из папки/файла.
              </li>
              <li>
                <b className="text-foreground">SeqNum</b> — порядковый номер, дополняется до 3 цифр (001, 002…).
              </li>
              <li>
                <b className="text-foreground">Size</b> — размер из пресета (150x200, 50x70, ONE…).
              </li>
              <li>
                <b className="text-foreground">Material</b> — материал из пресета (Флис, Сатин…).
              </li>
              <li>
                <b className="text-foreground">Category</b> — категория товара (Одеяло, Подушка, Одиночный…).
              </li>
              <li>
                <b className="text-foreground">IP</b> — IP-код (БТ, МА…). Опционален; если пуст — сегмент опускается.
              </li>
            </ul>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
