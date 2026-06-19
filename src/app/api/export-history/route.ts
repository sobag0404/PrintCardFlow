// PrintCardFlow — Export history (list + create)
// GET → last 50 records (no payloadJson)
// POST → create + cap at 200 total
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const records = await db.exportHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        kind: true,
        projectName: true,
        fileName: true,
        fileSize: true,
        artsCount: true,
        skuCount: true,
        presetCount: true,
        includeManifest: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ ok: true, records });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "export-history GET failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      kind?: string;
      projectName?: string;
      fileName?: string;
      fileSize?: number;
      artsCount?: number;
      skuCount?: number;
      presetCount?: number;
      includeManifest?: boolean;
      payloadJson?: string;
    };
    const created = await db.exportHistory.create({
      data: {
        kind: body.kind || "excel",
        projectName: body.projectName || "project",
        fileName: body.fileName || "export",
        fileSize: Number(body.fileSize ?? 0),
        artsCount: Number(body.artsCount ?? 0),
        skuCount: Number(body.skuCount ?? 0),
        presetCount: Number(body.presetCount ?? 0),
        includeManifest: Boolean(body.includeManifest),
        payloadJson: body.payloadJson || "",
      },
    });

    // Cap at 200 — delete oldest extras.
    const total = await db.exportHistory.count();
    if (total > 200) {
      const overflow = total - 200;
      const oldest = await db.exportHistory.findMany({
        orderBy: { createdAt: "asc" },
        take: overflow,
        select: { id: true },
      });
      if (oldest.length > 0) {
        await db.exportHistory.deleteMany({
          where: { id: { in: oldest.map((r) => r.id) } },
        });
      }
    }

    return NextResponse.json({ ok: true, record: created });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "export-history POST failed",
      },
      { status: 500 },
    );
  }
}
