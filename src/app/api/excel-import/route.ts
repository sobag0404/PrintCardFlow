// PrintCardFlow — Excel import
// POST (FormData with `file`) → { ok, rows, detectedColumns, sheetName, totalRows, warnings }
import { NextResponse } from "next/server";
import { parseExcelBuffer } from "@/lib/excel/exceljs-lib";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json(
        { ok: false, error: "Ожидается multipart/form-data с полем file." },
        { status: 400 },
      );
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Поле file не найдено или не является файлом." },
        { status: 400 },
      );
    }
    const arrayBuf = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    const result = await parseExcelBuffer(buffer);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "excel-import failed",
      },
      { status: 500 },
    );
  }
}
