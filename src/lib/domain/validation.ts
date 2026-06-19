// PrintCardFlow — Pure validation module
// No React, no store. Pure functions over domain types.
import type { Art, Preset } from "./types";

export interface ArtNameIssue {
  artId: string;
  artName: string;
  reason: "empty" | "too-long" | "forbidden-char";
  message: string;
}

export interface DuplicateSkuEntry {
  sku: string;
  count: number;
  artIds: string[];
  artNames: string[];
}

export interface DuplicateArtNameEntry {
  normalized: string;
  count: number;
  artIds: string[];
  artNames: string[];
}

export interface ProjectValidationResult {
  hasErrors: boolean;
  hasWarnings: boolean;
  artsWithoutPreset: Art[];
  artsWithInvalidNames: ArtNameIssue[];
  duplicateSkus: DuplicateSkuEntry[];
  duplicateArtNames: DuplicateArtNameEntry[];
  totalSkus: number;
  totalArts: number;
  assignedArts: number;
  summary: string;
}

const FORBIDDEN_NAME_CHARS = ["/", "\\", "\u0000", "\u0001", "\u0002", "\u0003", "\u0004", "\u0005", "\u0006", "\u0007", "\b", "\t", "\n", "\v", "\f", "\r"];

/** Validate a single art name. */
export function validateArtName(name: string): { ok: boolean; reason?: ArtNameIssue["reason"]; message?: string } {
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    return { ok: false, reason: "empty", message: "Имя арта пустое." };
  }
  if (trimmed.length > 60) {
    return { ok: false, reason: "too-long", message: `Имя длиннее 60 символов (${trimmed.length}).` };
  }
  for (const ch of FORBIDDEN_NAME_CHARS) {
    if (trimmed.includes(ch)) {
      return { ok: false, reason: "forbidden-char", message: `Имя содержит недопустимый символ «${ch === "\n" ? "\\n" : ch === "\t" ? "\\t" : ch}».` };
    }
  }
  return { ok: true };
}

/** Normalize an art name for duplicate detection (trim + lowercase + collapse spaces). */
function normalizeArtName(name: string): string {
  return (name ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Detect duplicate generated SKUs. */
export function detectDuplicateSkus(arts: Art[], _presets: Preset[]): DuplicateSkuEntry[] {
  const groups = new Map<string, { artIds: string[]; artNames: string[]; count: number }>();
  for (const art of arts) {
    for (const g of art.computedSkus ?? []) {
      if (!g.sku) continue;
      const entry = groups.get(g.sku) ?? { artIds: [], artNames: [], count: 0 };
      entry.count += 1;
      if (!entry.artIds.includes(art.id)) entry.artIds.push(art.id);
      if (!entry.artNames.includes(art.artName)) entry.artNames.push(art.artName);
      groups.set(g.sku, entry);
    }
  }
  const out: DuplicateSkuEntry[] = [];
  for (const [sku, e] of groups) {
    if (e.count > 1) {
      out.push({ sku, count: e.count, artIds: e.artIds, artNames: e.artNames });
    }
  }
  return out.sort((a, b) => b.count - a.count);
}

/** Detect duplicate art names (normalized). */
export function detectDuplicateArtNames(arts: Art[]): DuplicateArtNameEntry[] {
  const groups = new Map<string, { artIds: string[]; artNames: string[]; count: number }>();
  for (const art of arts) {
    const key = normalizeArtName(art.artName);
    if (!key) continue;
    const entry = groups.get(key) ?? { artIds: [], artNames: [], count: 0 };
    entry.count += 1;
    if (!entry.artIds.includes(art.id)) entry.artIds.push(art.id);
    if (!entry.artNames.includes(art.artName)) entry.artNames.push(art.artName);
    groups.set(key, entry);
  }
  const out: DuplicateArtNameEntry[] = [];
  for (const [normalized, e] of groups) {
    if (e.count > 1) {
      out.push({ normalized, count: e.count, artIds: e.artIds, artNames: e.artNames });
    }
  }
  return out.sort((a, b) => b.count - a.count);
}

/** RU plural-aware noun for «арт», «SKU», «дубликат». */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

/** Run full project validation. */
export function validateProject(arts: Art[], presets: Preset[]): ProjectValidationResult {
  const artsWithoutPreset = arts.filter((a) => !a.presetId);
  const artsWithInvalidNames: ArtNameIssue[] = [];
  for (const art of arts) {
    const r = validateArtName(art.artName);
    if (!r.ok && r.reason && r.message) {
      artsWithInvalidNames.push({
        artId: art.id,
        artName: art.artName,
        reason: r.reason,
        message: r.message,
      });
    }
  }
  const duplicateSkus = detectDuplicateSkus(arts, presets);
  const duplicateArtNames = detectDuplicateArtNames(arts);

  let totalSkus = 0;
  let assignedArts = 0;
  for (const a of arts) {
    totalSkus += a.computedSkus?.length ?? 0;
    if (a.presetId) assignedArts += 1;
  }

  const hasErrors = duplicateSkus.length > 0 || artsWithInvalidNames.length > 0;
  const hasWarnings = artsWithoutPreset.length > 0 || duplicateArtNames.length > 0;

  // Build summary string.
  const parts: string[] = [];
  if (!hasErrors && !hasWarnings) {
    parts.push(`Всё в порядке — ${totalSkus} ${pluralRu(totalSkus, ["SKU", "SKU", "SKU"])}, дубликатов нет`);
  } else {
    if (duplicateSkus.length > 0) {
      parts.push(`${duplicateSkus.length} ${pluralRu(duplicateSkus.length, ["дубликат SKU", "дубликата SKU", "дубликатов SKU"])}`);
    }
    if (artsWithInvalidNames.length > 0) {
      parts.push(`${artsWithInvalidNames.length} ${pluralRu(artsWithInvalidNames.length, ["арт с ошибкой имени", "арта с ошибкой имени", "артов с ошибкой имени"])}`);
    }
    if (artsWithoutPreset.length > 0) {
      parts.push(`${artsWithoutPreset.length} ${pluralRu(artsWithoutPreset.length, ["арт без пресета", "арта без пресета", "артов без пресета"])}`);
    }
    if (duplicateArtNames.length > 0) {
      parts.push(`${duplicateArtNames.length} ${pluralRu(duplicateArtNames.length, ["дубликат имени", "дубликата имени", "дубликатов имени"])}`);
    }
  }
  const summary = parts.join(" · ");

  return {
    hasErrors,
    hasWarnings,
    artsWithoutPreset,
    artsWithInvalidNames,
    duplicateSkus,
    duplicateArtNames,
    totalSkus,
    totalArts: arts.length,
    assignedArts,
    summary,
  };
}
