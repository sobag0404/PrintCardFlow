// PrintCardFlow — Preset template IO (Zod schemas, serialize/parse/download).
// Pure module, no React. Used by PresetEditor + PresetGallery.

import { z } from "zod";
import type { Preset, PresetTemplateBundle, SizeEntry } from "@/lib/domain/types";

// Allowed accent values (kept in sync with global CSS classes).
export const ACCENT_VALUES = [
  "amber",
  "rose",
  "pink",
  "fuchsia",
  "emerald",
  "violet",
] as const;

export const sizeEntrySchema = z.object({
  label: z.string().min(1, "Метка размера обязательна"),
  seqScope: z.string().min(1, "seqScope обязателен"),
}) satisfies z.ZodType<SizeEntry>;

export const presetSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "blanket",
    "pillow-nav",
    "pillow-multi",
    "pillow-sizes",
    "single",
    "custom",
  ]),
  name: z.string().min(1, "Название обязательно"),
  description: z.string(),
  material: z.string(),
  category: z.string(),
  sizes: z.array(sizeEntrySchema).min(1, "Должен быть хотя бы один размер"),
  ipEnabledDefault: z.boolean(),
  accent: z.enum(ACCENT_VALUES),
  icon: z.string().min(1),
}) satisfies z.ZodType<Preset>;

export const templateBundleSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  presets: z.array(presetSchema),
}) satisfies z.ZodType<PresetTemplateBundle>;

/** Serialize presets to a JSON string (template bundle format). */
export function serializePresets(presets: Preset[]): string {
  const bundle: PresetTemplateBundle = {
    version: 1,
    exportedAt: Date.now(),
    presets,
  };
  return JSON.stringify(bundle, null, 2);
}

/** Parse a template bundle from a JSON string. Throws on invalid input. */
export function parseTemplateBundle(json: string): PresetTemplateBundle {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    throw new Error(
      `Не удалось разобрать JSON: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  const result = templateBundleSchema.safeParse(data);
  if (!result.success) {
    const firstErr = result.error.issues[0];
    throw new Error(
      `Невалидный шаблон: ${firstErr?.path.join(".") ?? ""} — ${firstErr?.message ?? "ошибка"}`,
    );
  }
  return result.data;
}

/** Trigger a browser download of a preset template (.json) file. */
export function downloadPresetTemplate(presets: Preset[], filename = "presets.json"): void {
  if (typeof window === "undefined") return;
  const json = serializePresets(presets);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Read a File object from <input type="file"> and return parsed presets. */
export function readPresetTemplateFile(file: File): Promise<PresetTemplateBundle> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        resolve(parseTemplateBundle(text));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsText(file);
  });
}
