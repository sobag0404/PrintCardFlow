// PrintCardFlow — Demo data generator (for folder/scan step without real FS)
import type { Art } from "./types";

const DEMO_ART_NAMES = [
  "roses_red",
  "roses_pink",
  "lavender_field",
  "geometric_mono",
  "mint_dots",
  "navy_stripes",
  "autumn_leaves",
  "snowflake_winter",
  "summer_bloom",
  "cat_friends",
  "forest_mist",
  "ocean_waves",
  "sunset_dunes",
  "mountain_peak",
  "cherry_blossom",
  "minimal_lines",
  "boho_feathers",
  "kids_dino",
  "kids_space",
  "kids_unicorns",
  "kids_rainbow",
  "kids_bears",
  "luxury_gold",
  "scandi_leaves",
  "vintage_roses",
  "cyber_grid",
  "pastel_clouds",
  "terracotta",
  "marble_black",
  "watercolor_blur",
];

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function generateDemoArts(count = 30, basePath = "/demo/arts"): Art[] {
  const arts: Art[] = [];
  for (let i = 0; i < count; i++) {
    const name = DEMO_ART_NAMES[i % DEMO_ART_NAMES.length];
    const suffix = i >= DEMO_ART_NAMES.length ? `_${Math.floor(i / DEMO_ART_NAMES.length) + 1}` : "";
    arts.push({
      id: uid("art"),
      artName: `${name}${suffix}`,
      presetId: "",
      ipCode: null,
      seqOverride: 0,
      material: "",
      category: "",
      sizes: null,
      computedSkus: [],
      selected: false,
      source: `${basePath}/${name}${suffix}.png`,
      createdAt: Date.now() + i,
    });
  }
  return arts;
}

/** Simulate scanning a folder — returns arts with a small artificial delay. */
export function scanFolderDemo(count = 30, basePath = "/demo/arts"): Promise<Art[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(generateDemoArts(count, basePath)), 350);
  });
}

export const DEMO_BASE_PATHS = [
  "/Users/designer/PrintCards/2026_Spring",
  "/Users/designer/PrintCards/WB_batch_42",
  "/home/design/arts/textile_2026",
];
