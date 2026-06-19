// PrintCardFlow — Session by id
// GET → full session with parsed arts+presets
// PATCH → partial update { name?, arts?, presets? }
// DELETE → remove
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recomputeArtSkus } from "@/lib/domain/sku-generator";
import type { Art, Preset } from "@/lib/domain/types";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const session = await db.session.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Сессия не найдена." },
        { status: 404 },
      );
    }
    let arts: Art[] = [];
    let presets: Preset[] = [];
    try {
      arts = session.artsJson ? (JSON.parse(session.artsJson) as Art[]) : [];
      presets = session.presetsJson
        ? (JSON.parse(session.presetsJson) as Preset[])
        : [];
    } catch {
      // ignore JSON parse errors
    }
    return NextResponse.json({
      ok: true,
      session: {
        ...session,
        arts,
        presets,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "session GET failed",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      arts?: Art[];
      presets?: Preset[];
    };

    const existing = await db.session.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Сессия не найдена." },
        { status: 404 },
      );
    }

    const data: {
      name?: string;
      artsJson?: string;
      presetsJson?: string;
      artsCount?: number;
      skuCount?: number;
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }

    let arts: Art[] | undefined;
    let presets: Preset[] | undefined;
    if (Array.isArray(body.arts)) arts = body.arts;
    if (Array.isArray(body.presets)) presets = body.presets;

    if (arts || presets) {
      const mergedArts = arts ?? (existing.artsJson ? JSON.parse(existing.artsJson) as Art[] : []);
      const mergedPresets = presets ?? (existing.presetsJson ? JSON.parse(existing.presetsJson) as Preset[] : []);
      const recomputed = recomputeArtSkus(mergedArts, mergedPresets);
      let sku = 0;
      for (const a of recomputed) sku += a.computedSkus?.length ?? 0;
      data.artsJson = JSON.stringify(recomputed);
      data.presetsJson = JSON.stringify(mergedPresets);
      data.artsCount = recomputed.length;
      data.skuCount = sku;
    }

    const updated = await db.session.update({ where: { id }, data });
    return NextResponse.json({ ok: true, session: updated });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "session PATCH failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    await db.session.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "session DELETE failed",
      },
      { status: 500 },
    );
  }
}
