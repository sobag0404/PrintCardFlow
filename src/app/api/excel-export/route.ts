// PrintCardFlow — Excel export
// POST { projectName, arts, presets } → .xlsx blob
import { NextResponse } from "next/server";
import { buildExcelBuffer } from "@/lib/excel/exceljs-lib";
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

    const buffer = await buildExcelBuffer({ projectName, arts, presets });

    const fileName =
      renderFilenameTemplate("{project}_SKU_{date}_{time}", {
        project: projectName,
        date: new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, ""),
        time: new Date()
          .toISOString()
          .slice(11, 16)
          .replace(/:/g, ""),
        count: arts.length,
      }) + ".xlsx";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
        error: err instanceof Error ? err.message : "excel-export failed",
      },
      { status: 500 },
    );
  }
}
