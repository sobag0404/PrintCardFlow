// PrintCardFlow — TXT summary export
// POST { projectName, arts, presets } → text/plain (string response)
import { NextResponse } from "next/server";
import { buildTxtSummary } from "@/lib/export/text-exporters";
import { renderFilenameTemplate } from "@/lib/export/filename-template";
import type { Art, Preset } from "@/lib/domain/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      projectName?: string;
      arts?: Art[];
      presets?: Preset[];
    };
    const projectName = body.projectName || "project";
    const arts = Array.isArray(body.arts) ? body.arts : [];
    const presets = Array.isArray(body.presets) ? body.presets : [];

    const text = buildTxtSummary(arts, presets, projectName);
    const fileName =
      renderFilenameTemplate("{project}_SKU_{date}_{time}", {
        project: projectName,
        date: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
        time: new Date().toISOString().slice(11, 16).replace(/:/g, ""),
        count: arts.length,
      }) + "_summary.txt";

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(
          fileName,
        )}"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "txt-export failed",
      },
      { status: 500 },
    );
  }
}
