import type { Art } from "@/lib/domain/types";

export {};

type ElectronScanFolderResult =
  | {
      ok: true;
      arts?: Art[];
      basePath?: string;
      count?: number;
      error?: string;
    }
  | {
      ok: false;
      error?: string;
    };

interface ElectronPickFolderResult {
  ok: boolean;
  canceled?: boolean;
  path?: string;
}

interface ElectronPickFileFilter {
  name: string;
  extensions: string[];
}

interface ElectronAppInfo {
  version?: string;
  platform?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      scanFolder: (
        basePath: string,
        count?: number,
      ) => Promise<ElectronScanFolderResult>;
      pickFolder: () => Promise<ElectronPickFolderResult>;
      pickFile: (
        filters?: ElectronPickFileFilter[],
        title?: string,
      ) => Promise<ElectronPickFolderResult>;
      saveFile: (
        defaultName: string,
        data: string | Uint8Array,
        filters?: ElectronPickFileFilter[],
      ) => Promise<{ ok: boolean; path?: string; error?: string }>;
      appInfo: () => Promise<ElectronAppInfo>;
      ensureDb: () => Promise<{ ok: boolean; error?: string }>;
    };
  }
}
