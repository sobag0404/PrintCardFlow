// PrintCardFlow — Scan folder (demo)
// POST { basePath, count } → { ok, arts, basePath, count, presets }
import { NextResponse } from "next/server";
import { scanFolderDemo } from "@/lib/domain/demo-data";
import { BUILTIN_PRESETS } from "@/lib/domain/presets";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      basePath?: string;
      count?: number;
    };
    const basePath = body.basePath || "/demo/arts";
    const count = Math.max(1, Math.min(500, Number(body.count ?? 30) || 30));
    const arts = await scanFolderDemo(count, basePath);
    return NextResponse.json({
      ok: true,
      arts,
      basePath,
      count: arts.length,
      presets: BUILTIN_PRESETS,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "scan-folder failed",
      },
      { status: 500 },
    );
  }
}
