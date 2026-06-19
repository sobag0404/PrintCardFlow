// PrintCardFlow — ExcelJS helpers (server-side only)
// Uses exceljs for parsing and building .xlsx files.
import ExcelJS from "exceljs";
import type { Art, Preset } from "@/lib/domain/types";
import { resolveArtFields } from "@/lib/domain/sku-generator";

/** A single detected column mapping. */
export interface DetectedColumns {
  artName?: number;
  presetName?: number;
  material?: number;
  category?: number;
  size?: number;
  ip?: number;
  seq?: number;
  source?: number;
}

/** One parsed row from the imported Excel file. */
export interface ParsedExcelRow {
  artName: string;
  presetName: string;
  material: string;
  category: string;
  size: string;
  ip: string;
  seq: string;
  source: string;
  rowIndex: number;
}

export interface ParsedExcelResult {
  rows: ParsedExcelRow[];
  detectedColumns: DetectedColumns;
  sheetName: string;
  totalRows: number;
  warnings: string[];
}

/** Column aliases (lowercase) for fuzzy header detection. RU + EN. */
const COLUMN_ALIASES: Record<keyof DetectedColumns, string[]> = {
  artName: [
    "artname",
    "art name",
    "арт",
    "артнейм",
    "арт нейм",
    "название",
    "имя",
    "name",
    "filename",
    "file",
    "файл",
  ],
  presetName: [
    "preset",
    "presetname",
    "preset name",
    "пресет",
    "пресет нейм",
    "template",
    "шаблон",
  ],
  material: ["material", "материал", "мат"],
  category: ["category", "cat", "категория", "кат", "кат-я"],
  size: ["size", "размер", "размеры", "sizes"],
  ip: ["ip", "ип", "ipcode", "ip code", "ип код", "код"],
  seq: ["seq", "seqnum", "seq num", "номер", "sequence", "seqnumber"],
  source: ["source", "путь", "path", "файл путь", "file path"],
};

const FIELD_KEYS = Object.keys(COLUMN_ALIASES) as (keyof DetectedColumns)[];

/** Normalize a header string for comparison. */
function normalizeHeader(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Detect columns from a header row by matching aliases. */
function detectColumns(
  headerCells: string[],
  warnings: string[],
): DetectedColumns {
  const detected: DetectedColumns = {};
  const usedIndexes = new Set<number>();
  for (const key of FIELD_KEYS) {
    const aliases = COLUMN_ALIASES[key];
    let bestIdx = -1;
    // Exact match first.
    for (let i = 0; i < headerCells.length; i++) {
      if (usedIndexes.has(i)) continue;
      const norm = normalizeHeader(headerCells[i]);
      if (aliases.includes(norm)) {
        bestIdx = i;
        break;
      }
    }
    // Substring fallback.
    if (bestIdx === -1) {
      for (let i = 0; i < headerCells.length; i++) {
        if (usedIndexes.has(i)) continue;
        const norm = normalizeHeader(headerCells[i]);
        if (!norm) continue;
        if (aliases.some((a) => norm.includes(a) || a.includes(norm))) {
          bestIdx = i;
          break;
        }
      }
    }
    if (bestIdx !== -1) {
      detected[key] = bestIdx;
      usedIndexes.add(bestIdx);
    }
  }
  if (detected.artName === undefined) {
    warnings.push("Не удалось определить колонку ArtName.");
  }
  return detected;
}

/** Parse an Excel buffer and detect columns flexibly. */
export async function parseExcelBuffer(
  buffer: Buffer,
): Promise<ParsedExcelResult> {
  const warnings: string[] = [];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return {
      rows: [],
      detectedColumns: {},
      sheetName: "",
      totalRows: 0,
      warnings: ["Файл не содержит листов."],
    };
  }

  const sheetName = sheet.name ?? "Sheet1";

  // Read header row (row 1).
  const headerRow = sheet.getRow(1);
  const headerCells: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headerCells[colNumber - 1] = String(cell.value ?? "");
  });

  const detected = detectColumns(headerCells, warnings);

  // If no columns detected at all, treat row 1 as data.
  let startRow = 2;
  const hasAnyDetection = FIELD_KEYS.some((k) => detected[k] !== undefined);
  if (!hasAnyDetection) {
    warnings.push(
      "Заголовки не распознаны — импортируем все строки как артнеймы в первой колонке.",
    );
    detected.artName = 0;
    startRow = 1;
  }

  const rows: ParsedExcelRow[] = [];
  let totalRows = 0;
  for (let r = startRow; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (!row || row.cellCount === 0) continue;
    const getCell = (idx?: number) =>
      idx === undefined ? "" : String(row.getCell(idx + 1).value ?? "").trim();
    const artName = getCell(detected.artName);
    // Skip fully empty rows.
    const allEmpty = FIELD_KEYS.every((k) => !getCell(detected[k]));
    if (allEmpty && !artName) continue;
    totalRows += 1;
    rows.push({
      artName,
      presetName: getCell(detected.presetName),
      material: getCell(detected.material),
      category: getCell(detected.category),
      size: getCell(detected.size),
      ip: getCell(detected.ip),
      seq: getCell(detected.seq),
      source: getCell(detected.source),
      rowIndex: r,
    });
  }

  if (rows.length === 0) {
    warnings.push("В файле не найдено строк данных.");
  }

  return {
    rows,
    detectedColumns: detected,
    sheetName,
    totalRows,
    warnings,
  };
}

/** Header style: dark fill, white bold text. */
const HEADER_FILL: Partial<ExcelJS.Fill> = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F2937" }, // gray-800
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};

const SKU_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FF059669" }, // emerald-600
  size: 11,
};

/** Build a styled .xlsx buffer from arts + presets. */
export async function buildExcelBuffer(opts: {
  projectName: string;
  arts: Art[];
  presets: Preset[];
}): Promise<Buffer> {
  const { projectName, arts, presets } = opts;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PrintCardFlow";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("SKU", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Header row.
  const headers = [
    "ArtName",
    "SeqNum",
    "Size",
    "Material",
    "Category",
    "IP",
    "SKU",
    "Preset",
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF111827" } },
    };
  });

  // Column widths.
  sheet.columns = [
    { width: 26 },
    { width: 8 },
    { width: 12 },
    { width: 14 },
    { width: 12 },
    { width: 6 },
    { width: 42 },
    { width: 22 },
  ];

  // Build a preset map.
  const presetMap = new Map<string, Preset>();
  for (const p of presets) presetMap.set(p.id, p);

  // Data rows.
  let dataRowIdx = 0;
  for (const art of arts) {
    const preset = presetMap.get(art.presetId) ?? null;
    const presetName = preset?.name ?? "(пресет не назначен)";
    const skus = art.computedSkus ?? [];
    if (skus.length === 0) {
      const row = sheet.addRow([
        art.artName,
        "",
        "",
        art.material || preset?.material || "",
        art.category || preset?.category || "",
        art.ipCode ?? "",
        "(пресет не назначен)",
        presetName,
      ]);
      styleRow(row, dataRowIdx);
      dataRowIdx += 1;
      continue;
    }
    for (const s of skus) {
      const row = sheet.addRow([
        art.artName,
        s.seqNum,
        s.size,
        s.material,
        s.category,
        s.ip,
        s.sku,
        presetName,
      ]);
      styleRow(row, dataRowIdx, 6); // SKU column index (0-based)
      dataRowIdx += 1;
    }
  }

  // Add a project info footer row.
  sheet.addRow([]);
  const infoRow = sheet.addRow([
    `Проект: ${projectName}`,
    "",
    "",
    "",
    "",
    "",
    `Сгенерировано: ${new Date().toLocaleString("ru-RU")}`,
    "",
  ]);
  infoRow.font = { italic: true, color: { argb: "FF6B7280" }, size: 10 };

  // Auto-filter on the header row.
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

/** Apply alternating-row + SKU-emphasis styling. */
function styleRow(row: ExcelJS.Row, idx: number, skuColIdx?: number): void {
  const isAlt = idx % 2 === 1;
  row.height = 18;
  row.eachCell((cell, colNumber) => {
    cell.alignment = { vertical: "middle", horizontal: "left" };
    if (isAlt) {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF9FAFB" }, // gray-50
      };
    }
    if (skuColIdx !== undefined && colNumber - 1 === skuColIdx) {
      cell.font = SKU_FONT;
    }
  });
}
