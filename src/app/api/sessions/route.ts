// PrintCardFlow — Sessions (list + upsert)
// GET → all sessions sorted by updatedAt desc
// POST → upsert by name with serialized arts+presets
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recomputeArtSkus } from "@/lib/domain/sku-generator";
import type { Art, Preset } from "@/lib/domain/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sessions = await db.session.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        artsCount: true,
        skuCount: true,
        updatedAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, sessions });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "sessions GET failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      arts?: Art[];
      presets?: Preset[];
    };
    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Имя сессии обязательно." },
        { status: 400 },
      );
    }
    const arts = Array.isArray(body.arts) ? body.arts : [];
    const presets = Array.isArray(body.presets) ? body.presets : [];
    const recomputed = recomputeArtSkus(arts, presets);
    let skuCount = 0;
    for (const a of recomputed) skuCount += a.computedSkus?.length ?? 0;

    const artsJson = JSON.stringify(recomputed);
    const presetsJson = JSON.stringify(presets);

    // Find existing by name.
    const existing = await db.session.findFirst({
      where: { name },
      select: { id: true },
    });

    let record;
    if (existing) {
      record = await db.session.update({
        where: { id: existing.id },
        data: {
          name,
          artsJson,
          presetsJson,
          artsCount: recomputed.length,
          skuCount,
        },
      });
    } else {
      record = await db.session.create({
        data: {
          name,
          artsJson,
          presetsJson,
          artsCount: recomputed.length,
          skuCount,
        },
      });
    }
    return NextResponse.json({ ok: true, session: record });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "sessions POST failed",
      },
      { status: 500 },
    );
  }
}
