// PrintCardFlow — Preset definitions (6 built-in presets)
import type { Preset } from "./types";

export const BUILTIN_PRESETS: Preset[] = [
  {
    id: "preset-blanket",
    kind: "blanket",
    name: "Одеяло",
    description: "Печатное одеяло: 3 размера, последовательная нумерация.",
    material: "Флис",
    category: "ОДЛ",
    sizes: [
      { label: "150x200", seqScope: "blanket" },
      { label: "200x220", seqScope: "blanket" },
      { label: "220x240", seqScope: "blanket" },
    ],
    ipEnabledDefault: false,
    accent: "amber",
    icon: "BedDouble",
  },
  {
    id: "preset-pillow-nav",
    kind: "pillow-nav",
    name: "Подушка-НАВ",
    description: "Наволочка: один размер, отдельная нумерация.",
    material: "Сатин",
    category: "ПДШ",
    sizes: [{ label: "50x70", seqScope: "pillow-nav" }],
    ipEnabledDefault: true,
    accent: "rose",
    icon: "Square",
  },
  {
    id: "preset-pillow-multi",
    kind: "pillow-multi",
    name: "Подушка-МУЛЬТИ",
    description: "Наволочка: 3 размера, общая нумерация.",
    material: "Сатин",
    category: "ПДШ",
    sizes: [
      { label: "40x40", seqScope: "pillow-multi" },
      { label: "45x45", seqScope: "pillow-multi" },
      { label: "50x50", seqScope: "pillow-multi" },
    ],
    ipEnabledDefault: true,
    accent: "pink",
    icon: "Layers",
  },
  {
    id: "preset-pillow-sizes",
    kind: "pillow-sizes",
    name: "Подушка-РАЗМЕРЫ",
    description: "Наволочка: нумерация по каждому размеру отдельно.",
    material: "Сатин",
    category: "ПДШ",
    sizes: [
      { label: "40x40", seqScope: "pillow-sizes-40" },
      { label: "45x45", seqScope: "pillow-sizes-45" },
      { label: "50x50", seqScope: "pillow-sizes-50" },
    ],
    ipEnabledDefault: true,
    accent: "fuchsia",
    icon: "Rows3",
  },
  {
    id: "preset-single",
    kind: "single",
    name: "Одиночный",
    description: "Один размер, одна позиция в SKU.",
    material: "Хлопок",
    category: "ОДН",
    sizes: [{ label: "ONE", seqScope: "single" }],
    ipEnabledDefault: false,
    accent: "emerald",
    icon: "Circle",
  },
  {
    id: "preset-custom",
    kind: "custom",
    name: "Свой",
    description: "Полностью настраиваемый пресет.",
    material: "",
    category: "",
    sizes: [{ label: "ONE", seqScope: "custom" }],
    ipEnabledDefault: false,
    accent: "violet",
    icon: "Settings2",
  },
];

export const PRESET_BY_ID = (id: string, list: Preset[] = BUILTIN_PRESETS) =>
  list.find((p) => p.id === id) ?? null;

export const PRESET_BY_KIND = (kind: string, list: Preset[] = BUILTIN_PRESETS) =>
  list.find((p) => p.kind === kind) ?? null;
