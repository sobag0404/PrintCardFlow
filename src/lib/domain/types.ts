// PrintCardFlow — Core domain types

/** IP codes — optional per-art suffix in SKU. */
export type IpCode = "БТ" | "МА" | "МВ" | "МЛ" | "ЗА" | "ЗН" | "";

/** Preset kind identifier. */
export type PresetKind =
  | "blanket" // Одеяло
  | "pillow-nav" // Подушка-НАВ
  | "pillow-multi" // Подушка-МУЛЬТИ
  | "pillow-sizes" // Подушка-РАЗМЕРЫ
  | "single" // Одиночный
  | "custom"; // Свой

/** A single size entry within a preset's size set. */
export interface SizeEntry {
  /** Display name, e.g. "50x70", "ONE", "Нав 50x70". */
  label: string;
  /** Sequence-numbering scope. Arts sharing the same scope get an incrementing SeqNum. */
  seqScope: string;
}

/** Definition of a preset — drives SKU generation and default fields. */
export interface Preset {
  id: string;
  kind: PresetKind;
  name: string;
  description: string;
  /** Material value written into SKU (e.g. "Флис", "Сатин", "Хлопок"). */
  material: string;
  /** Product/category value written into SKU (e.g. "Одеяло", "Подушка"). */
  category: string;
  /** Sizes produced by this preset. */
  sizes: SizeEntry[];
  /** Whether IP code is enabled by default for this preset. */
  ipEnabledDefault: boolean;
  /** Accent color (Tailwind class fragment) for UI chips. */
  accent: string;
  /** Icon name from lucide-react. */
  icon: string;
}

/** A single art (design) row in the workflow. */
export interface Art {
  id: string;
  /** Source file name without extension, e.g. "flowers_001". */
  artName: string;
  /** Assigned preset id (empty string if unassigned). */
  presetId: string;
  /** Per-art IP code override; null means inherit preset default / disabled. */
  ipCode: IpCode | null;
  /** Manual sequence number override (0 = auto). */
  seqOverride: number;
  /** Material override (empty = use preset). */
  material: string;
  /** Category override (empty = use preset). */
  category: string;
  /** Extra sizes override (null = use preset). */
  sizes: SizeEntry[] | null;
  /** Computed SKU value (filled during preview). */
  computedSkus: GeneratedSku[];
  /** Whether the art is selected in the table. */
  selected: boolean;
  /** Source path or upload ref (informational). */
  source: string;
  /** Optional thumbnail data URL. */
  thumbnail?: string;
  /** Creation timestamp. */
  createdAt: number;
}

/** One generated SKU line for one art×size combination. */
export interface GeneratedSku {
  artId: string;
  artName: string;
  seqNum: number;
  size: string;
  material: string;
  category: string;
  ip: IpCode;
  /** Final assembled SKU string. */
  sku: string;
}

/** Wizard step identifiers. */
export type WizardStep =
  | "start"
  | "folder"
  | "scan"
  | "preset"
  | "preview"
  | "export";

export const STEP_ORDER: WizardStep[] = [
  "start",
  "folder",
  "scan",
  "preset",
  "preview",
  "export",
];

export const STEP_LABELS: Record<WizardStep, string> = {
  start: "Старт",
  folder: "Папка",
  scan: "Сканирование",
  preset: "Пресеты",
  preview: "Просмотр",
  export: "Экспорт",
};

/** Project / session configuration. */
export interface ProjectConfig {
  name: string;
  /** Base folder path (informational for web; real FS only in Electron). */
  basePath: string;
  createdAt: number;
  updatedAt: number;
}

/** Preset template bundle for import/export. */
export interface PresetTemplateBundle {
  version: 1;
  exportedAt: number;
  presets: Preset[];
}
