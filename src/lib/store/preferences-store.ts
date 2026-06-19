// PrintCardFlow — Preferences store (separate from wizard-store)
// Persisted to localStorage under "printcardflow-preferences".
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ExportFormat = "excel" | "zip" | "csv" | "json" | "txt";
export type ThemePreference = "light" | "dark" | "system";

export interface PreferencesState {
  defaultExportFormat: ExportFormat;
  filenameTemplate: string;
  autoLogExports: boolean;
  showExportToast: boolean;
  defaultIncludeManifest: boolean;
  themePreference: ThemePreference;

  setDefaultExportFormat: (v: ExportFormat) => void;
  setFilenameTemplate: (v: string) => void;
  setAutoLogExports: (v: boolean) => void;
  setShowExportToast: (v: boolean) => void;
  setDefaultIncludeManifest: (v: boolean) => void;
  setThemePreference: (v: ThemePreference) => void;
  resetToDefaults: () => void;
}

export const PREFERENCES_DEFAULTS = {
  defaultExportFormat: "excel" as ExportFormat,
  filenameTemplate: "{project}_SKU_{date}_{time}",
  autoLogExports: true,
  showExportToast: true,
  defaultIncludeManifest: true,
  themePreference: "system" as ThemePreference,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...PREFERENCES_DEFAULTS,

      setDefaultExportFormat: (v) => set({ defaultExportFormat: v }),
      setFilenameTemplate: (v) => set({ filenameTemplate: v }),
      setAutoLogExports: (v) => set({ autoLogExports: v }),
      setShowExportToast: (v) => set({ showExportToast: v }),
      setDefaultIncludeManifest: (v) => set({ defaultIncludeManifest: v }),
      setThemePreference: (v) => set({ themePreference: v }),
      resetToDefaults: () => set({ ...PREFERENCES_DEFAULTS }),
    }),
    {
      name: "printcardflow-preferences",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Sync getter for non-React code.
 * Reads current state without subscribing to updates.
 */
export function getPreferences(): PreferencesState {
  return usePreferencesStore.getState();
}
