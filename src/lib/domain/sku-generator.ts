// PrintCardFlow — SKU generator
// Format: {ArtName}_{SeqNum}_{Size}_{Material}_{Category}_{IP}
// IP is optional; when empty, the trailing segment is omitted.
import type { Art, GeneratedSku, IpCode, Preset } from "./types";

export const SKU_SEPARATOR = "_";

export interface SkuParts {
  artName: string;
  seqNum: number;
  size: string;
  material: string;
  category: string;
  ip: IpCode;
}

/** Sanitize a raw string for use inside a SKU segment. */
export function sanitizeSkuSegment(raw: string): string {
  if (!raw) return "";
  let s = String(raw).trim();
  // Replace forbidden characters with dashes.
  s = s.replace(/[\\/_\s]+/g, "-");
  s = s.replace(/[^A-Za-zА-Яа-я0-9.\-]/g, "");
  // Collapse repeated dashes.
  s = s.replace(/-+/g, "-");
  s = s.replace(/^-|-$/g, "");
  return s;
}

/** Assemble SKU parts into the final string. */
export function buildSku(parts: SkuParts): string {
  const segments = [
    sanitizeSkuSegment(parts.artName),
    String(parts.seqNum).padStart(3, "0"),
    sanitizeSkuSegment(parts.size),
    sanitizeSkuSegment(parts.material),
    sanitizeSkuSegment(parts.category),
  ];
  if (parts.ip) {
    segments.push(sanitizeSkuSegment(parts.ip));
  }
  return segments.filter(Boolean).join(SKU_SEPARATOR);
}

/** Resolve the effective values for an art given its preset (or overrides). */
export function resolveArtFields(
  art: Art,
  preset: Preset | null,
): {
  material: string;
  category: string;
  sizes: { label: string; seqScope: string }[];
  ip: IpCode;
} {
  const material = art.material || preset?.material || "";
  const category = art.category || preset?.category || "";
  const sizes =
    art.sizes && art.sizes.length > 0
      ? art.sizes
      : preset?.sizes ?? [{ label: "ONE", seqScope: "default" }];
  const ip: IpCode =
    art.ipCode === null
      ? preset?.ipEnabledDefault
        ? "БТ"
        : ""
      : art.ipCode;
  return { material, category, sizes, ip };
}

/**
 * Generate SKUs for a list of arts.
 * SeqNum is assigned per (presetId, seqScope) group, in the order arts appear.
 * Manual seqOverride (non-zero) is respected and skips auto-numbering for that art.
 */
export interface SeqScopeKey {
  presetId: string;
  seqScope: string;
}

export function seqScopeKey(presetId: string, seqScope: string): string {
  return `${presetId}::${seqScope}`;
}

export function generateSkus(arts: Art[], presets: Preset[]): GeneratedSku[] {
  // Build preset lookup.
  const presetMap = new Map<string, Preset>();
  for (const p of presets) presetMap.set(p.id, p);

  // Counters per scope.
  const counters = new Map<string, number>();

  const out: GeneratedSku[] = [];
  for (const art of arts) {
    const preset = presetMap.get(art.presetId) ?? null;
    const { material, category, sizes, ip } = resolveArtFields(art, preset);
    for (const size of sizes) {
      const key = seqScopeKey(art.presetId || "none", size.seqScope);
      let seq: number;
      if (art.seqOverride && art.seqOverride > 0) {
        seq = art.seqOverride;
        // Do not advance counter when manually overridden (keeps group ordering stable).
      } else {
        const next = (counters.get(key) ?? 0) + 1;
        counters.set(key, next);
        seq = next;
      }
      const sku = buildSku({
        artName: art.artName,
        seqNum: seq,
        size: size.label,
        material,
        category,
        ip,
      });
      out.push({
        artId: art.id,
        artName: art.artName,
        seqNum: seq,
        size: size.label,
        material,
        category,
        ip,
        sku,
      });
    }
  }
  return out;
}

/** Recompute per-art computedSkus array. */
export function recomputeArtSkus(arts: Art[], presets: Preset[]): Art[] {
  const all = generateSkus(arts, presets);
  const byArt = new Map<string, GeneratedSku[]>();
  for (const g of all) {
    const arr = byArt.get(g.artId) ?? [];
    arr.push(g);
    byArt.set(g.artId, arr);
  }
  return arts.map((a) => ({ ...a, computedSkus: byArt.get(a.id) ?? [] }));
}

/** Statistics helper for UI badges. */
export function skuStats(arts: Art[]) {
  let total = 0;
  let assigned = 0;
  for (const a of arts) {
    total += a.computedSkus.length;
    if (a.presetId) assigned += 1;
  }
  return { arts: arts.length, assigned, totalSkus: total };
}
