// PrintCardFlow — Electron client helper (detects Electron vs web)
"use client";
import type { Art } from "@/lib/domain/types";

export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI;
}

export async function scanFolder(basePath: string, count: number = 30) {
  if (isElectron() && window.electronAPI) {
    const result = await window.electronAPI.scanFolder(basePath, count);
    if (!result.ok) return { ok: false, arts: [], basePath, count: 0, error: result.error };
    return { ok: true, arts: result.arts || [], basePath: result.basePath || basePath, count: result.count || 0 };
  }
  const { scanFolderDemo } = await import("@/lib/domain/demo-data");
  const arts = await scanFolderDemo(count, basePath);
  return { ok: true, arts, basePath, count: arts.length, demo: true };
}

export async function pickFolder(): Promise<string | null> {
  if (!isElectron() || !window.electronAPI) return null;
  const r = await window.electronAPI.pickFolder();
  return r.ok && !r.canceled ? r.path || null : null;
}

export async function getAppInfo() {
  if (!isElectron() || !window.electronAPI) return null;
  return window.electronAPI.appInfo();
}
