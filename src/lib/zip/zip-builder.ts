// PrintCardFlow — ZIP archive builder (server-side only)
// Uses JSZip + buildExcelBuffer + buildCsv + buildTxtSummary.
import JSZip from "jszip";
import type { Art, Preset } from "@/lib/domain/types";
import { buildExcelBuffer } from "@/lib/excel/exceljs-lib";
import {
  buildCsv,
  buildJson,
  buildTxtSummary,
} from "@/lib/export/text-exporters";
import { formatDateStamp, formatTimeStamp } from "@/lib/export/filename-template";

export interface ZipBuildOptions {
  projectName: string;
  arts: Art[];
  presets: Preset[];
  includeManifest?: boolean;
  onProgress?: (percent: number, status: string) => void;
}

export interface ZipBuildResult {
  buffer: Buffer;
  fileName: string;
  fileCount: number;
}

/** Compute simple SKU + assigned counts. */
function computeStats(arts: Art[]) {
  let sku = 0;
  let assigned = 0;
  for (const a of arts) {
    sku += a.computedSkus?.length ?? 0;
    if (a.presetId) assigned += 1;
  }
  return { arts: arts.length, sku, assigned };
}

/** Sanitize a name for use inside the ZIP file names. */
function sanitizeName(s: string): string {
  return (s || "project")
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\s]+|[_\s]+$/g, "")
    .slice(0, 60) || "project";
}

/** Build a multi-file ZIP archive with xlsx, csv, manifest, summary, readme. */
export async function buildZipArchive(
  opts: ZipBuildOptions,
): Promise<ZipBuildResult> {
  const { projectName, arts, presets, includeManifest = true, onProgress } = opts;
  const zip = new JSZip();
  const base = sanitizeName(projectName);
  const dateStr = formatDateStamp();
  const timeStr = formatTimeStamp();
  const stamp = `${base}_SKU_${dateStr}_${timeStr}`;

  const progress = (p: number, status: string) => onProgress?.(p, status);

  progress(5, "Готовим Excel-файл…");
  const xlsxBuffer = await buildExcelBuffer({ projectName, arts, presets });
  zip.file(`${stamp}.xlsx`, xlsxBuffer);

  progress(35, "Готовим CSV…");
  const csvString = buildCsv(arts, presets);
  zip.file(`${stamp}.csv`, csvString);

  progress(55, "Готовим текстовую сводку…");
  const summary = buildTxtSummary(arts, presets, projectName);
  zip.file(`${stamp}_summary.txt`, summary);

  if (includeManifest) {
    progress(70, "Готовим манифест…");
    const stats = computeStats(arts);
    const manifest = {
      projectName,
      exportedAt: new Date().toISOString(),
      generator: "PrintCardFlow",
      version: 1,
      stats,
      files: [
        `${stamp}.xlsx`,
        `${stamp}.csv`,
        `${stamp}_summary.txt`,
        `${stamp}_manifest.json`,
        `${stamp}_README.txt`,
      ],
    };
    zip.file(`${stamp}_manifest.json`, JSON.stringify(manifest, null, 2));
  }

  progress(82, "Готовим README…");
  const readme = buildReadme(projectName, stamp, arts.length, presets.length);
  zip.file(`${stamp}_README.txt`, readme);

  progress(92, "Архивируем…");
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  progress(100, "Готово.");

  const fileCount = includeManifest ? 5 : 4;
  return {
    buffer: Buffer.from(zipBuffer),
    fileName: `${stamp}.zip`,
    fileCount,
  };
}

function buildReadme(
  projectName: string,
  stamp: string,
  artsCount: number,
  presetsCount: number,
): string {
  const lines: string[] = [];
  lines.push("PrintCardFlow — ZIP-архив экспорта");
  lines.push("====================================");
  lines.push("");
  lines.push(`Проект:        ${projectName}`);
  lines.push(`Дата создания: ${new Date().toLocaleString("ru-RU")}`);
  lines.push(`Артов:         ${artsCount}`);
  lines.push(`Пресетов:      ${presetsCount}`);
  lines.push("");
  lines.push("Состав архива:");
  lines.push(`  ${stamp}.xlsx          — Excel-файл со всеми SKU`);
  lines.push(`  ${stamp}.csv           — CSV (UTF-8, точка с запятой)`);
  lines.push(`  ${stamp}_summary.txt   — текстовая сводка`);
  lines.push(`  ${stamp}_manifest.json — машинно-читаемый манифест`);
  lines.push(`  ${stamp}_README.txt    — этот файл`);
  lines.push("");
  lines.push("Формат SKU: {ArtName}_{SeqNum}_{Size}_{Material}_{Category}_{IP}");
  lines.push("IP-суффикс опускается, если IP не задан.");
  lines.push("");
  lines.push("— конец —");
  return lines.join("\n");
}
