// PrintCardFlow — Isomorphic text exporters (no Node APIs)
// These run in both browser and server contexts.
import type { Art, Preset } from "@/lib/domain/types";
import { resolveArtFields } from "@/lib/domain/sku-generator";

/** UTF-8 BOM marker so Excel opens CSV as UTF-8. */
const UTF8_BOM = "\uFEFF";

/** CSV column header (semicolon-separated). */
const CSV_HEADER = "ArtName;SeqNum;Size;Material;Category;IP;SKU;Preset";

/** Escape a CSV value: wrap in quotes and double any internal quotes. */
function csvEscape(value: string): string {
  if (value == null) return '""';
  const s = String(value);
  // Always wrap in quotes; double internal quotes.
  return `"${s.replace(/"/g, '""')}"`;
}

/** Build a semicolon-separated CSV string (with BOM) from arts+presets. */
export function buildCsv(arts: Art[], presets: Preset[]): string {
  const presetMap = new Map<string, Preset>();
  for (const p of presets) presetMap.set(p.id, p);

  const lines: string[] = [CSV_HEADER];

  for (const art of arts) {
    const preset = presetMap.get(art.presetId) ?? null;
    const presetName = preset?.name ?? "(пресет не назначен)";
    const { material, category, sizes, ip } = resolveArtFields(art, preset);
    if (sizes.length === 0) {
      // Art without preset and no sizes — emit a single placeholder row.
      lines.push(
        [
          csvEscape(art.artName),
          csvEscape(""),
          csvEscape(""),
          csvEscape(material),
          csvEscape(category),
          csvEscape(ip),
          csvEscape("(пресет не назначен)"),
          csvEscape(presetName),
        ].join(";"),
      );
      continue;
    }
    for (const sku of art.computedSkus ?? []) {
      lines.push(
        [
          csvEscape(art.artName),
          csvEscape(String(sku.seqNum)),
          csvEscape(sku.size),
          csvEscape(sku.material || material),
          csvEscape(sku.category || category),
          csvEscape(sku.ip),
          csvEscape(sku.sku),
          csvEscape(presetName),
        ].join(";"),
      );
    }
  }

  return UTF8_BOM + lines.join("\r\n");
}

/** Build a pretty-printed JSON export string. */
export function buildJson(arts: Art[], presets: Preset[]): string {
  const presetMap = new Map<string, Preset>();
  for (const p of presets) presetMap.set(p.id, p);

  // Pre-compute SKU count.
  let skuCount = 0;
  for (const a of arts) skuCount += (a.computedSkus?.length ?? 0);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1 as const,
    stats: {
      arts: arts.length,
      skus: skuCount,
      presets: presets.length,
    },
    presets: presets.map((p) => ({
      id: p.id,
      kind: p.kind,
      name: p.name,
      description: p.description,
      material: p.material,
      category: p.category,
      sizes: p.sizes,
      ipEnabledDefault: p.ipEnabledDefault,
      accent: p.accent,
      icon: p.icon,
    })),
    arts: arts.map((a) => {
      const preset = presetMap.get(a.presetId) ?? null;
      const presetName = preset?.name ?? null;
      return {
        id: a.id,
        artName: a.artName,
        presetId: a.presetId,
        presetName,
        ipCode: a.ipCode,
        seqOverride: a.seqOverride,
        material: a.material,
        category: a.category,
        sizes: a.sizes,
        source: a.source,
        computedSkus: a.computedSkus ?? [],
      };
    }),
  };

  return JSON.stringify(payload, null, 2);
}

/** Build a human-readable plain-text summary. */
export function buildTxtSummary(
  arts: Art[],
  presets: Preset[],
  projectName: string,
): string {
  const presetMap = new Map<string, Preset>();
  for (const p of presets) presetMap.set(p.id, p);

  const dateStr = new Date().toLocaleString("ru-RU");
  let skuCount = 0;
  let assignedCount = 0;
  for (const a of arts) {
    skuCount += a.computedSkus?.length ?? 0;
    if (a.presetId) assignedCount += 1;
  }

  const lines: string[] = [];
  lines.push("============================================");
  lines.push("  PrintCardFlow — Сводка по SKU");
  lines.push("============================================");
  lines.push(`Проект:    ${projectName || "(без названия)"}`);
  lines.push(`Дата:      ${dateStr}`);
  lines.push("");
  lines.push("Статистика:");
  lines.push(`  Артов всего:        ${arts.length}`);
  lines.push(`  С назначенным пресетом: ${assignedCount}`);
  lines.push(`  Пресетов:           ${presets.length}`);
  lines.push(`  Сгенерировано SKU:  ${skuCount}`);
  lines.push("");
  lines.push("============================================");
  lines.push("  Детализация по артам");
  lines.push("============================================");
  lines.push("");

  if (arts.length === 0) {
    lines.push("  (нет артов)");
    lines.push("");
  }

  for (const art of arts) {
    const preset = presetMap.get(art.presetId) ?? null;
    const presetName = preset?.name ?? "(пресет не назначен)";
    lines.push(`■ ${art.artName}`);
    lines.push(`  Пресет: ${presetName}`);
    if (art.ipCode !== null) lines.push(`  IP код: ${art.ipCode || "(нет)"}`);
    if (art.seqOverride > 0)
      lines.push(`  SeqNum: ${art.seqOverride} (вручную)`);
    const skus = art.computedSkus ?? [];
    if (skus.length === 0) {
      lines.push(`  SKU: (нет — пресет не назначен)`);
    } else {
      lines.push(`  SKU (${skus.length}):`);
      for (const s of skus) {
        lines.push(`    • [${s.seqNum}] ${s.size} → ${s.sku}`);
      }
    }
    lines.push("");
  }

  lines.push("============================================");
  lines.push("  Пресеты проекта");
  lines.push("============================================");
  for (const p of presets) {
    lines.push(`• ${p.name} (${p.kind})`);
    lines.push(`  Материал: ${p.material || "—"}, Категория: ${p.category || "—"}`);
    lines.push(`  Размеры: ${p.sizes.map((s) => s.label).join(", ") || "—"}`);
    lines.push("");
  }
  lines.push("--- конец сводки ---");

  return lines.join("\n");
}
