// PrintCardFlow — Re-download an export from stored snapshot
// GET → rebuilds the file from payloadJson and returns the blob.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildExcelBuffer } from "@/lib/excel/exceljs-lib";
import { buildZipArchive } from "@/lib/zip/zip-builder";
import {
  buildCsv,
  buildJson,
  buildTxtSummary,
} from "@/lib/export/text-exporters";
import { recomputeArtSkus } from "@/lib/domain/sku-generator";
import type { Art, Preset } from "@/lib/domain/types";

export const runtime = "nodejs";

interface SnapshotPayload {
  arts?: Art[];
  presets?: Preset[];
}

/** Parse the stored payloadJson snapshot. */
function parsePayload(raw: string): { arts: Art[]; presets: Preset[] } {
  if (!raw) return { arts: [], presets: [] };
  try {
    const parsed = JSON.parse(raw) as SnapshotPayload;
    const arts = Array.isArray(parsed.arts) ? (parsed.arts as Art[]) : [];
    const presets = Array.isArray(parsed.presets)
      ? (parsed.presets as Preset[])
      : [];
    // Recompute SKUs to ensure consistency.
    return { arts: recomputeArtSkus(arts, presets), presets };
  } catch {
    return { arts: [], presets: [] };
  }
}

/** Pick a sensible filename from the stored record. */
function deriveFileName(record: {
  fileName: string;
  kind: string;
}): string {
  const base = record.fileName.replace(/\.[^.]+$/, "");
  switch (record.kind) {
    case "excel":
      return `${base}.xlsx`;
    case "zip":
      return `${base}.zip`;
    case "csv":
      return `${base}.csv`;
    case "json":
      return `${base}.json`;
    case "txt":
      return `${base}_summary.txt`;
    default:
      return record.fileName || "export";
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const record = await db.exportHistory.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json(
        { ok: false, error: "Запись не найдена." },
        { status: 404 },
      );
    }

    const { arts, presets } = parsePayload(record.payloadJson);
    const fileName = deriveFileName(record);

    switch (record.kind) {
      case "excel": {
        const buf = await buildExcelBuffer({
          projectName: record.projectName,
          arts,
          presets,
        });
        return new NextResponse(buf, {
          status: 200,
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(
              fileName,
            )}"`,
            "Content-Length": String(buf.byteLength),
          },
        });
      }
      case "zip": {
        const { buffer } = await buildZipArchive({
          projectName: record.projectName,
          arts,
          presets,
          includeManifest: record.includeManifest,
        });
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(
              fileName,
            )}"`,
            "Content-Length": String(buffer.byteLength),
          },
        });
      }
      case "csv": {
        const csv = buildCsv(arts, presets);
        return new NextResponse(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(
              fileName,
            )}"`,
          },
        });
      }
      case "json": {
        const json = buildJson(arts, presets);
        return new NextResponse(json, {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(
              fileName,
            )}"`,
          },
        });
      }
      case "txt": {
        const text = buildTxtSummary(arts, presets, record.projectName);
        return new NextResponse(text, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(
              fileName,
            )}"`,
          },
        });
      }
      default:
        return NextResponse.json(
          { ok: false, error: `Неизвестный тип экспорта: ${record.kind}` },
          { status: 400 },
        );
    }
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "redownload failed",
      },
      { status: 500 },
    );
  }
}
