// PrintCardFlow — ZIP export
// POST { projectName, arts, presets, includeManifest } → .zip blob
import { NextResponse } from "next/server";
import { buildZipArchive } from "@/lib/zip/zip-builder";
import type { Art, Preset } from "@/lib/domain/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      projectName?: string;
      arts?: Art[];
      presets?: Preset[];
      includeManifest?: boolean;
    };
    const projectName = body.projectName || "project";
    const arts = Array.isArray(body.arts) ? body.arts : [];
    const presets = Array.isArray(body.presets) ? body.presets : [];
    const includeManifest = body.includeManifest !== false;

    const { buffer, fileName } = await buildZipArchive({
      projectName,
      arts,
      presets,
      includeManifest,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          fileName,
        )}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "zip-export failed",
      },
      { status: 500 },
    );
  }
}
