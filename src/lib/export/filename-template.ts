// PrintCardFlow — Isomorphic filename template utilities
// No Node APIs; safe for browser use.

export interface FilenameContext {
  project: string;
  date: string;
  time: string;
  count: number;
}

/** Characters that are forbidden in filenames across OSes. */
const FORBIDDEN_CHARS = /[/\\:*?"<>|]/g;

/** Maximum filename length (without extension). */
const MAX_LENGTH = 100;

/** Sanitize a single segment: replace forbidden chars, trim, collapse spaces. */
function sanitizeSegment(s: string): string {
  return s
    .replace(FORBIDDEN_CHARS, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\s]+|[_\s]+$/g, "")
    .slice(0, MAX_LENGTH);
}

/** Render a filename template by substituting {project}, {date}, {time}, {count}. */
export function renderFilenameTemplate(
  template: string,
  ctx: FilenameContext,
): string {
  const filled = (template || "{project}_SKU_{date}_{time}")
    .replace(/\{project\}/g, ctx.project || "project")
    .replace(/\{date\}/g, ctx.date || "")
    .replace(/\{time\}/g, ctx.time || "")
    .replace(/\{count\}/g, String(ctx.count ?? 0));

  // Sanitize the final string (segments stay joined).
  const sanitized = filled
    .replace(FORBIDDEN_CHARS, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_\s]+|[_\s]+$/g, "");

  return sanitized.slice(0, MAX_LENGTH) || "export";
}

/** Current date as "YYYYMMDD". */
export function formatDateStamp(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** Current time as "HHMM". */
export function formatTimeStamp(d: Date = new Date()): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}${m}`;
}

/** Build a full filename (basename + extension). */
export function buildFilename(
  template: string,
  ext: string,
  project: string,
  count: number,
  d: Date = new Date(),
): string {
  const base = renderFilenameTemplate(template, {
    project,
    date: formatDateStamp(d),
    time: formatTimeStamp(d),
    count,
  });
  const cleanExt = ext.startsWith(".") ? ext : `.${ext}`;
  return `${base}${cleanExt}`;
}
