// PrintCardFlow — Export handlers (client-side)
// "use client" — runs in the browser, triggers downloads, logs history, toasts.
"use client";

import { useWizardStore } from "@/lib/store/wizard-store";
import {
  getPreferences,
  type ExportFormat,
} from "@/lib/store/preferences-store";
import {
  buildCsv,
  buildJson,
  buildTxtSummary,
} from "@/lib/export/text-exporters";
import {
  buildFilename,
  formatDateStamp,
  formatTimeStamp,
} from "@/lib/export/filename-template";
import type { Art, Preset } from "@/lib/domain/types";

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay to ensure download starts.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Build a filename from the preferences template + project name + count. */
export function buildFilenameFor(
  ext: string,
  projectName: string,
  artsCount: number,
): string {
  const prefs = getPreferences();
  return buildFilename(
    prefs.filenameTemplate,
    ext,
    projectName,
    artsCount,
  );
}

interface LogExportArgs {
  kind: ExportFormat;
  projectName: string;
  fileName: string;
  fileSize: number;
  arts: Art[];
  presets: Preset[];
  includeManifest?: boolean;
}

/** Fire-and-forget POST to /api/export-history. Never throws. */
export function logExport(args: LogExportArgs): void {
  try {
    let skuCount = 0;
    for (const a of args.arts) skuCount += a.computedSkus?.length ?? 0;
    const payload = {
      kind: args.kind,
      projectName: args.projectName,
      fileName: args.fileName,
      fileSize: args.fileSize,
      artsCount: args.arts.length,
      skuCount,
      presetCount: args.presets.length,
      includeManifest: Boolean(args.includeManifest),
      payloadJson: JSON.stringify({ arts: args.arts, presets: args.presets }),
    };
    void fetch("/api/export-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      /* swallow */
    });
  } catch {
    /* swallow */
  }
}

/** Read fresh state from the wizard store + preferences. */
function readState(): {
  projectName: string;
  arts: Art[];
  presets: Preset[];
} {
  const s = useWizardStore.getState();
  return {
    projectName: s.project?.name || "project",
    arts: s.arts,
    presets: s.presets,
  };
}

function showToast(variant: "success" | "error", title: string, description?: string) {
  const prefs = getPreferences();
  if (!prefs.showExportToast) return;
  useWizardStore.getState().pushToast({ variant, title, description });
}

/** Excel export — POST to /api/excel-export, download blob. */
export async function triggerExcelExport(): Promise<void> {
  const store = useWizardStore.getState();
  const { projectName, arts, presets } = readState();
  try {
    store.setExportProgress(10, "Запрос к серверу…");
    const res = await fetch("/api/excel-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, arts, presets }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    store.setExportProgress(70, "Загрузка файла…");
    const blob = await res.blob();
    store.setExportProgress(90, "Сохранение…");
    const fileName = buildFilenameFor("xlsx", projectName, arts.length);
    downloadBlob(blob, fileName);
    store.setExportProgress(100, "Готово.");
    if (getPreferences().autoLogExports) {
      logExport({
        kind: "excel",
        projectName,
        fileName,
        fileSize: blob.size,
        arts,
        presets,
      });
    }
    showToast("success", "Excel экспортирован", fileName);
  } catch (err) {
    store.setExportProgress(0, "");
    showToast(
      "error",
      "Ошибка экспорта Excel",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    setTimeout(() => useWizardStore.getState().setExportProgress(0, ""), 1500);
  }
}

/** ZIP export — POST to /api/zip-export, download blob. */
export async function triggerZipExport(opts?: {
  includeManifest?: boolean;
}): Promise<void> {
  const store = useWizardStore.getState();
  const { projectName, arts, presets } = readState();
  const prefs = getPreferences();
  const includeManifest = opts?.includeManifest ?? prefs.defaultIncludeManifest;
  try {
    store.setExportProgress(10, "Запрос к серверу…");
    const res = await fetch("/api/zip-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, arts, presets, includeManifest }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    store.setExportProgress(70, "Загрузка архива…");
    const blob = await res.blob();
    store.setExportProgress(95, "Сохранение…");
    const fileName = buildFilenameFor("zip", projectName, arts.length);
    downloadBlob(blob, fileName);
    store.setExportProgress(100, "Готово.");
    if (prefs.autoLogExports) {
      logExport({
        kind: "zip",
        projectName,
        fileName,
        fileSize: blob.size,
        arts,
        presets,
        includeManifest,
      });
    }
    showToast("success", "ZIP экспортирован", fileName);
  } catch (err) {
    store.setExportProgress(0, "");
    showToast(
      "error",
      "Ошибка экспорта ZIP",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    setTimeout(() => useWizardStore.getState().setExportProgress(0, ""), 1500);
  }
}

/** CSV export — client-side build + download (avoids route handler flakiness). */
export function triggerCsvExport(): void {
  const store = useWizardStore.getState();
  const { projectName, arts, presets } = readState();
  try {
    const csv = buildCsv(arts, presets);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const fileName = buildFilenameFor("csv", projectName, arts.length);
    downloadBlob(blob, fileName);
    if (getPreferences().autoLogExports) {
      logExport({
        kind: "csv",
        projectName,
        fileName,
        fileSize: blob.size,
        arts,
        presets,
      });
    }
    showToast("success", "CSV экспортирован", fileName);
  } catch (err) {
    showToast(
      "error",
      "Ошибка экспорта CSV",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    store.setExportProgress(0, "");
  }
}

/** JSON export — client-side build + download. */
export function triggerJsonExport(): void {
  const store = useWizardStore.getState();
  const { projectName, arts, presets } = readState();
  try {
    const json = buildJson(arts, presets);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const fileName = buildFilenameFor("json", projectName, arts.length);
    downloadBlob(blob, fileName);
    if (getPreferences().autoLogExports) {
      logExport({
        kind: "json",
        projectName,
        fileName,
        fileSize: blob.size,
        arts,
        presets,
      });
    }
    showToast("success", "JSON экспортирован", fileName);
  } catch (err) {
    showToast(
      "error",
      "Ошибка экспорта JSON",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    store.setExportProgress(0, "");
  }
}

/** TXT summary export — client-side build + download. */
export function triggerTxtExport(): void {
  const store = useWizardStore.getState();
  const { projectName, arts, presets } = readState();
  try {
    const text = buildTxtSummary(arts, presets, projectName);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    // Filename uses a _summary suffix.
    const base = buildFilenameFor("txt", projectName, arts.length).replace(
      /\.txt$/,
      "_summary.txt",
    );
    downloadBlob(blob, base);
    if (getPreferences().autoLogExports) {
      logExport({
        kind: "txt",
        projectName,
        fileName: base,
        fileSize: blob.size,
        arts,
        presets,
      });
    }
    showToast("success", "TXT-сводка экспортирована", base);
  } catch (err) {
    showToast(
      "error",
      "Ошибка экспорта TXT",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    store.setExportProgress(0, "");
  }
}

/** Trigger the default export format from preferences. */
export async function triggerDefaultExport(): Promise<void> {
  const fmt = getPreferences().defaultExportFormat;
  switch (fmt) {
    case "excel":
      return triggerExcelExport();
    case "zip":
      return triggerZipExport();
    case "csv":
      return triggerCsvExport();
    case "json":
      return triggerJsonExport();
    case "txt":
      return triggerTxtExport();
    default:
      return triggerExcelExport();
  }
}

/** Re-export the date/time helpers for UI consumers. */
export { formatDateStamp, formatTimeStamp };
