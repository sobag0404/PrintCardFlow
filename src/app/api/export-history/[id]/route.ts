// PrintCardFlow — Export history record by id
// GET → full record with payloadJson
// DELETE → remove
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

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
    return NextResponse.json({ ok: true, record });
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

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    await db.exportHistory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error ? err.message : "export-history DELETE failed",
      },
      { status: 500 },
    );
  }
}
