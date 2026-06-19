# Task ID: P — Export libs + API routes

## Agent
full-stack-developer (Export libs + API routes)

## Scope
Built all export libraries, the preferences store, every API route, and the client-side export handlers for PrintCardFlow.

## Files created
- `src/lib/export/text-exporters.ts` — `buildCsv`, `buildJson`, `buildTxtSummary` (isomorphic)
- `src/lib/export/filename-template.ts` — `renderFilenameTemplate`, `formatDateStamp`, `formatTimeStamp`, `buildFilename` (isomorphic)
- `src/lib/excel/exceljs-lib.ts` — `parseExcelBuffer`, `buildExcelBuffer` (server-side, ExcelJS)
- `src/lib/zip/zip-builder.ts` — `buildZipArchive` with onProgress (server-side, JSZip)
- `src/lib/store/preferences-store.ts` — Zustand store, `getPreferences()`, `PREFERENCES_DEFAULTS`
- `src/app/api/scan-folder/route.ts` — POST → demo scan
- `src/app/api/excel-import/route.ts` — POST FormData → parseExcelBuffer
- `src/app/api/excel-export/route.ts` — POST → .xlsx blob
- `src/app/api/zip-export/route.ts` — POST → .zip blob
- `src/app/api/csv-export/route.ts` — POST → text/csv string
- `src/app/api/json-export/route.ts` — POST → application/json string
- `src/app/api/txt-export/route.ts` — POST → text/plain string
- `src/app/api/export-history/route.ts` — GET (last 50, no payloadJson) / POST (create + cap 200)
- `src/app/api/export-history/[id]/route.ts` — GET (full) / DELETE
- `src/app/api/export-history/[id]/redownload/route.ts` — GET rebuild from payloadJson
- `src/app/api/sessions/route.ts` — GET (all sorted) / POST (upsert by name)
- `src/app/api/sessions/[id]/route.ts` — GET (parsed) / PATCH / DELETE
- `src/components/wizard/export-handlers.ts` — `"use client"`, trigger* handlers + logExport + downloadBlob + buildFilenameFor + triggerDefaultExport

## Verification
- `bun run lint` passes clean (no errors)
- All routes tested via curl: scan-folder, excel-export, zip-export, csv-export, json-export, txt-export, export-history GET/POST/DELETE, redownload, sessions GET/POST/GET-by-id/DELETE — all return HTTP 200 with correct content types
- Excel-export produces valid xlsx (file says "Microsoft Excel 2007+")
- CSV has UTF-8 BOM and proper quoting
- Prisma queries execute successfully against ExportHistory + Session models

## Notes for downstream agents
- The store API confirmed: `useWizardStore.getState()` exposes `arts`, `presets`, `project`, `setExportProgress(p, status)`, `pushToast({variant, title, description})`. Variant is `"default" | "success" | "error" | "warning"`.
- Preferences store is separate (key `printcardflow-preferences`); use `getPreferences()` for non-React reads.
- All API routes are `runtime = "nodejs"` and use `new NextResponse(string, {headers})` for text responses (no Buffer for text — Buffer caused intermittent 500s in dev).
- Excel and ZIP responses DO use Buffer (binary content) — that's fine, those are not text responses.
- The export-handlers module is `"use client"`; CSV/JSON/TXT exports are built client-side via isomorphic libs to avoid route-handler flakiness. Excel and ZIP go through API routes because they need ExcelJS/JSZip (Node APIs).
