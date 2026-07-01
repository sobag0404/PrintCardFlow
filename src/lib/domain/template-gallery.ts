// PrintCardFlow — Curated template bundles for the preset gallery.
// 5 bundles, 17 presets total. Each preset has a stable id `tpl-{bundleId}-{n}`
// so they can be safely imported alongside user/builtin presets.

import type { Preset, PresetTemplateBundle } from "./types";

export interface GalleryBundle {
  id: string;
  name: string;
  description: string;
  /** Accent color used for the bundle tile + sidebar dot. */
  accent: string;
  /** Lucide icon name shown on the bundle tile. */
  icon: string;
  /** Category tag used to filter bundles in the gallery sidebar. */
  category: string;
  presets: Preset[];
}

export const GALLERY_CATEGORIES: string[] = [
  "Все",
  "Текстиль",
  "Маркетплейс",
  "Детское",
  "Минимализм",
  "Премиум",
];

const TEXTILE_BASIC: Preset[] = [
  {
    id: "tpl-textile-basic-1",
    kind: "blanket",
    name: "Одеяло Флис",
    description: "Печатное флисовое одеяло: 3 размера, общая нумерация.",
    material: "Флис",
    category: "Одеяло",
    sizes: [
      { label: "150x200", seqScope: "tpl-textile-basic-blanket" },
      { label: "200x220", seqScope: "tpl-textile-basic-blanket" },
      { label: "220x240", seqScope: "tpl-textile-basic-blanket" },
    ],
    ipEnabledDefault: false,
    accent: "amber",
    icon: "BedDouble",
  },
  {
    id: "tpl-textile-basic-2",
    kind: "pillow-nav",
    name: "Наволочка Сатин",
    description: "Наволочка 50x70, отдельная нумерация, IP по умолчанию.",
    material: "Сатин",
    category: "Подушка",
    sizes: [{ label: "50x70", seqScope: "tpl-textile-basic-nav" }],
    ipEnabledDefault: true,
    accent: "amber",
    icon: "Square",
  },
  {
    id: "tpl-textile-basic-3",
    kind: "pillow-multi",
    name: "Подушка Мульти",
    description: "Наволочка 3 размеров с общей нумерацией.",
    material: "Сатин",
    category: "Подушка",
    sizes: [
      { label: "40x40", seqScope: "tpl-textile-basic-multi" },
      { label: "45x45", seqScope: "tpl-textile-basic-multi" },
      { label: "50x50", seqScope: "tpl-textile-basic-multi" },
    ],
    ipEnabledDefault: true,
    accent: "amber",
    icon: "Layers",
  },
  {
    id: "tpl-textile-basic-4",
    kind: "single",
    name: "Плед Одиночный",
    description: "Один размер, без IP. Подходит для простых принтов.",
    material: "Хлопок",
    category: "Одиночный",
    sizes: [{ label: "ONE", seqScope: "tpl-textile-basic-single" }],
    ipEnabledDefault: false,
    accent: "amber",
    icon: "Circle",
  },
];

const WB_PILLOWS: Preset[] = [
  {
    id: "tpl-wb-pillows-1",
    kind: "pillow-nav",
    name: "WB Подушка 45x45",
    description: "Wildberries: наволочка 45x45, IP БТ.",
    material: "Сатин",
    category: "Подушка",
    sizes: [{ label: "45x45", seqScope: "tpl-wb-nav-45" }],
    ipEnabledDefault: true,
    accent: "rose",
    icon: "Square",
  },
  {
    id: "tpl-wb-pillows-2",
    kind: "pillow-nav",
    name: "WB Подушка 50x70",
    description: "Wildberries: наволочка 50x70, IP БТ.",
    material: "Сатин",
    category: "Подушка",
    sizes: [{ label: "50x70", seqScope: "tpl-wb-nav-50" }],
    ipEnabledDefault: true,
    accent: "rose",
    icon: "Square",
  },
  {
    id: "tpl-wb-pillows-3",
    kind: "pillow-multi",
    name: "WB Подушка Мульти",
    description: "Wildberries: 3 размера, общая нумерация.",
    material: "Сатин",
    category: "Подушка",
    sizes: [
      { label: "40x40", seqScope: "tpl-wb-multi" },
      { label: "45x45", seqScope: "tpl-wb-multi" },
      { label: "50x50", seqScope: "tpl-wb-multi" },
    ],
    ipEnabledDefault: true,
    accent: "rose",
    icon: "Layers",
  },
  {
    id: "tpl-wb-pillows-4",
    kind: "pillow-sizes",
    name: "WB Подушка Размеры",
    description: "Wildberries: нумерация по каждому размеру отдельно.",
    material: "Сатин",
    category: "Подушка",
    sizes: [
      { label: "40x40", seqScope: "tpl-wb-sz-40" },
      { label: "45x45", seqScope: "tpl-wb-sz-45" },
      { label: "50x50", seqScope: "tpl-wb-sz-50" },
    ],
    ipEnabledDefault: true,
    accent: "rose",
    icon: "Rows3",
  },
];

const KIDS: Preset[] = [
  {
    id: "tpl-kids-1",
    kind: "blanket",
    name: "Детское Одеяло",
    description: "Детское флисовое одеяло, 2 размера.",
    material: "Флис",
    category: "Одеяло",
    sizes: [
      { label: "100x140", seqScope: "tpl-kids-blanket" },
      { label: "120x150", seqScope: "tpl-kids-blanket" },
    ],
    ipEnabledDefault: false,
    accent: "emerald",
    icon: "BedDouble",
  },
  {
    id: "tpl-kids-2",
    kind: "pillow-nav",
    name: "Детская Наволочка",
    description: "Детская наволочка 40x40, IP МА.",
    material: "Сатин",
    category: "Подушка",
    sizes: [{ label: "40x40", seqScope: "tpl-kids-nav" }],
    ipEnabledDefault: true,
    accent: "emerald",
    icon: "Square",
  },
  {
    id: "tpl-kids-3",
    kind: "single",
    name: "Детский Плед",
    description: "Детский плед ONE, без IP.",
    material: "Хлопок",
    category: "Одиночный",
    sizes: [{ label: "ONE", seqScope: "tpl-kids-single" }],
    ipEnabledDefault: false,
    accent: "emerald",
    icon: "Circle",
  },
  {
    id: "tpl-kids-4",
    kind: "pillow-multi",
    name: "Детский Мульти",
    description: "Детская наволочка 3 размеров, общая нумерация.",
    material: "Сатин",
    category: "Подушка",
    sizes: [
      { label: "30x30", seqScope: "tpl-kids-multi" },
      { label: "35x35", seqScope: "tpl-kids-multi" },
      { label: "40x40", seqScope: "tpl-kids-multi" },
    ],
    ipEnabledDefault: false,
    accent: "emerald",
    icon: "Layers",
  },
];

const MINIMAL: Preset[] = [
  {
    id: "tpl-minimal-1",
    kind: "single",
    name: "Минимал Одиночный",
    description: "Чистый минимализм: один размер, без IP.",
    material: "Хлопок",
    category: "Одиночный",
    sizes: [{ label: "ONE", seqScope: "tpl-minimal-single" }],
    ipEnabledDefault: false,
    accent: "violet",
    icon: "Circle",
  },
  {
    id: "tpl-minimal-2",
    kind: "blanket",
    name: "Минимал Одеяло",
    description: "Минималистичное одеяло: 2 размера, без IP.",
    material: "Хлопок",
    category: "Одеяло",
    sizes: [
      { label: "150x200", seqScope: "tpl-minimal-blanket" },
      { label: "200x220", seqScope: "tpl-minimal-blanket" },
    ],
    ipEnabledDefault: false,
    accent: "violet",
    icon: "BedDouble",
  },
];

const PREMIUM: Preset[] = [
  {
    id: "tpl-premium-1",
    kind: "blanket",
    name: "Премиум Одеяло Сатин",
    description: "Премиум-сатин, 3 размера, IP ЗН.",
    material: "Сатин-Премиум",
    category: "Одеяло",
    sizes: [
      { label: "150x200", seqScope: "tpl-premium-blanket" },
      { label: "200x220", seqScope: "tpl-premium-blanket" },
      { label: "220x240", seqScope: "tpl-premium-blanket" },
    ],
    ipEnabledDefault: true,
    accent: "fuchsia",
    icon: "BedDouble",
  },
  {
    id: "tpl-premium-2",
    kind: "pillow-nav",
    name: "Премиум Наволочка",
    description: "Премиум-сатин наволочка 50x70, IP ЗН.",
    material: "Сатин-Премиум",
    category: "Подушка",
    sizes: [{ label: "50x70", seqScope: "tpl-premium-nav" }],
    ipEnabledDefault: true,
    accent: "fuchsia",
    icon: "Square",
  },
  {
    id: "tpl-premium-3",
    kind: "pillow-sizes",
    name: "Премиум Размеры",
    description: "Премиум-наволочка, нумерация по размерам, IP ЗН.",
    material: "Сатин-Премиум",
    category: "Подушка",
    sizes: [
      { label: "45x45", seqScope: "tpl-premium-sz-45" },
      { label: "50x50", seqScope: "tpl-premium-sz-50" },
      { label: "50x70", seqScope: "tpl-premium-sz-50x70" },
    ],
    ipEnabledDefault: true,
    accent: "fuchsia",
    icon: "Rows3",
  },
];

export const GALLERY_BUNDLES: GalleryBundle[] = [
  {
    id: "textile-basic",
    name: "Текстиль — Базовый",
    description:
      "Универсальный набор для текстильной печати: одеяла, наволочки и пледы.",
    accent: "amber",
    icon: "Layers",
    category: "Текстиль",
    presets: TEXTILE_BASIC,
  },
  {
    id: "wb-pillows",
    name: "Wildberries — Подушки",
    description:
      "Готовые пресеты под маркетплейс Wildberries: наволочки и подушки.",
    accent: "rose",
    icon: "ShoppingBag",
    category: "Маркетплейс",
    presets: WB_PILLOWS,
  },
  {
    id: "kids",
    name: "Детские товары",
    description: "Детские одеяла, наволочки и пледы с уменьшенными размерами.",
    accent: "emerald",
    icon: "Baby",
    category: "Детское",
    presets: KIDS,
  },
  {
    id: "minimal",
    name: "Минимализм",
    description: "Лаконичные пресеты без IP-кодов — для чистых принтов.",
    accent: "violet",
    icon: "Circle",
    category: "Минимализм",
    presets: MINIMAL,
  },
  {
    id: "premium",
    name: "Премиум Текстиль",
    description: "Премиум-сатин с IP-кодом ЗН для всех позиций.",
    accent: "fuchsia",
    icon: "Crown",
    category: "Премиум",
    presets: PREMIUM,
  },
];

export function getBundleById(id: string): GalleryBundle | null {
  return GALLERY_BUNDLES.find((b) => b.id === id) ?? null;
}

/** Build a PresetTemplateBundle from a gallery bundle (for export/serialize). */
export function bundleToTemplateBundle(
  bundle: GalleryBundle,
): PresetTemplateBundle {
  return {
    version: 1,
    exportedAt: Date.now(),
    presets: bundle.presets,
  };
}
