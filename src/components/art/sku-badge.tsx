// PrintCardFlow — SkuBadge (emerald mono chip with copy-to-clipboard).
"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { useWizardStore } from "@/lib/store/wizard-store";
import { cn } from "@/lib/utils";

export interface SkuBadgeProps {
  sku: string;
  /** When true, clicking copies to clipboard + shows toast. */
  showCopy?: boolean;
  className?: string;
  title?: string;
}

export function SkuBadge({
  sku,
  showCopy = true,
  className,
  title,
}: SkuBadgeProps) {
  const pushToast = useWizardStore((s) => s.pushToast);
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async (e: React.MouseEvent) => {
    if (!showCopy) return;
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sku);
      } else {
        // Fallback for older browsers / insecure contexts.
        const ta = document.createElement("textarea");
        ta.value = sku;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch {
          /* noop */
        }
        document.body.removeChild(ta);
      }
      setCopied(true);
      pushToast({ variant: "success", title: "SKU скопирован", description: sku });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Не удалось скопировать",
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const Comp: "button" | "span" = showCopy ? "button" : "span";

  return (
    <Comp
      type={showCopy ? "button" : undefined}
      onClick={showCopy ? handleCopy : undefined}
      title={title ?? sku}
      aria-label={showCopy ? `Скопировать SKU: ${sku}` : undefined}
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300",
        showCopy && "cursor-pointer transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/15 focus-visible:outline-none focus-visible:pcf-focus",
        className,
      )}
    >
      <span className="truncate pcf-mono">{sku}</span>
      {showCopy && (
        <span className="shrink-0" aria-hidden>
          {copied ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3 opacity-60" />
          )}
        </span>
      )}
    </Comp>
  );
}
