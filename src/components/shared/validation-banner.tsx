// PrintCardFlow — Validation banner (collapsible).
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWizardStore } from "@/lib/store/wizard-store";
import { validateProject, pluralRu } from "@/lib/domain/validation";
import { cn } from "@/lib/utils";

export function ValidationBanner() {
  const arts = useWizardStore((s) => s.arts);
  const presets = useWizardStore((s) => s.presets);

  const result = React.useMemo(
    () => validateProject(arts, presets),
    [arts, presets],
  );

  // Auto-expand on first error.
  const [open, setOpen] = React.useState(false);
  const prevHasErrors = React.useRef(false);
  React.useEffect(() => {
    if (result.hasErrors && !prevHasErrors.current) {
      setOpen(true);
    }
    prevHasErrors.current = result.hasErrors;
  }, [result.hasErrors]);

  if (arts.length === 0) return null;

  const tone = result.hasErrors
    ? "rose"
    : result.hasWarnings
      ? "amber"
      : "emerald";

  const Icon = result.hasErrors ? XCircle : result.hasWarnings ? AlertTriangle : CheckCircle2;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card/60 backdrop-blur-sm transition-colors",
        tone === "rose" && "border-rose-500/40 bg-rose-500/5",
        tone === "amber" && "border-amber-500/40 bg-amber-500/5",
        tone === "emerald" && "border-emerald-500/40 bg-emerald-500/5",
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <Icon
          className={cn(
            "size-5 shrink-0",
            tone === "rose" && "text-rose-500",
            tone === "amber" && "text-amber-500",
            tone === "emerald" && "text-emerald-500",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">
            {result.hasErrors
              ? "Найдены ошибки валидации"
              : result.hasWarnings
                ? "Есть предупреждения"
                : "Всё в порядке"}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {result.summary || "Нет данных для валидации"}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {result.duplicateSkus.length > 0 && (
            <Badge variant="outline" className="border-rose-500/40 text-rose-600 dark:text-rose-400">
              {result.duplicateSkus.length} {pluralRu(result.duplicateSkus.length, ["дубл.", "дубл.", "дубл."])} SKU
            </Badge>
          )}
          {result.artsWithoutPreset.length > 0 && (
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 dark:text-amber-400">
              {result.artsWithoutPreset.length} без пресета
            </Badge>
          )}
          {(result.hasErrors || result.hasWarnings) && (
            <Button
              variant="ghost"
              size="icon"
              className="pcf-focus h-7 w-7"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Свернуть детали" : "Развернуть детали"}
              aria-expanded={open}
            >
              <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="size-3.5" />
              </motion.span>
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (result.hasErrors || result.hasWarnings) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pcf-divider" />
            <div className="space-y-3 p-3 text-xs">
              {result.duplicateSkus.length > 0 && (
                <div>
                  <div className="mb-1.5 font-semibold text-rose-600 dark:text-rose-400">
                    Дубликаты SKU
                  </div>
                  <ul className="space-y-1">
                    {result.duplicateSkus.slice(0, 10).map((d) => (
                      <li key={d.sku} className="flex items-baseline gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 pcf-mono text-[11px]">
                          {d.sku}
                        </code>
                        <span className="text-muted-foreground">
                          ×{d.count} · арты: {d.artNames.join(", ")}
                        </span>
                      </li>
                    ))}
                    {result.duplicateSkus.length > 10 && (
                      <li className="text-muted-foreground italic">
                        …и ещё {result.duplicateSkus.length - 10}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {result.artsWithInvalidNames.length > 0 && (
                <div>
                  <div className="mb-1.5 font-semibold text-rose-600 dark:text-rose-400">
                    Арты с ошибкой имени
                  </div>
                  <ul className="space-y-1">
                    {result.artsWithInvalidNames.slice(0, 10).map((a) => (
                      <li key={a.artId}>
                        <code className="rounded bg-muted px-1.5 py-0.5 pcf-mono text-[11px]">
                          {a.artName || "(пусто)"}
                        </code>
                        <span className="ml-2 text-muted-foreground">{a.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.artsWithoutPreset.length > 0 && (
                <div>
                  <div className="mb-1.5 font-semibold text-amber-600 dark:text-amber-400">
                    Арты без пресета ({result.artsWithoutPreset.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.artsWithoutPreset.slice(0, 20).map((a) => (
                      <code
                        key={a.id}
                        className="rounded bg-muted px-1.5 py-0.5 pcf-mono text-[11px]"
                      >
                        {a.artName}
                      </code>
                    ))}
                    {result.artsWithoutPreset.length > 20 && (
                      <span className="text-muted-foreground italic">
                        …и ещё {result.artsWithoutPreset.length - 20}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {result.duplicateArtNames.length > 0 && (
                <div>
                  <div className="mb-1.5 font-semibold text-amber-600 dark:text-amber-400">
                    Дубликаты имён артов
                  </div>
                  <ul className="space-y-1">
                    {result.duplicateArtNames.slice(0, 5).map((d) => (
                      <li key={d.normalized} className="text-muted-foreground">
                        <code className="rounded bg-muted px-1.5 py-0.5 pcf-mono text-[11px]">
                          {d.artNames[0]}
                        </code>{" "}
                        ×{d.count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
