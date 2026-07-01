// PrintCardFlow — Wizard state (Zustand, persisted to localStorage)
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Art,
  Preset,
  ProjectConfig,
  WizardStep,
  IpCode,
} from "@/lib/domain/types";
import { BUILTIN_PRESETS } from "@/lib/domain/presets";
import { STEP_ORDER } from "@/lib/domain/types";
import { recomputeArtSkus } from "@/lib/domain/sku-generator";

export interface ToastEntry {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "success" | "error" | "warning";
}

interface WizardState {
  // Step navigation
  step: WizardStep;
  maxReachedStep: number;

  // Project
  project: ProjectConfig | null;

  // Data
  arts: Art[];
  presets: Preset[];

  // Undo/Redo (session-only, not persisted)
  past: Art[][];
  future: Art[][];

  // Recently used presets (persisted)
  recentPresetIds: string[];

  // UI
  toasts: ToastEntry[];
  helpOpen: boolean;
  exportProgress: number;
  exportStatus: string;

  // Actions — navigation
  setStep: (step: WizardStep) => void;
  next: () => void;
  prev: () => void;
  canNext: () => boolean;
  canPrev: () => boolean;

  // Actions — project
  startProject: (name: string, basePath: string) => void;
  resetProject: () => void;

  // Actions — arts
  setArts: (arts: Art[]) => void;
  addArts: (arts: Art[]) => void;
  removeArt: (id: string) => void;
  removeSelected: () => void;
  clearArts: () => void;
  updateArt: (id: string, patch: Partial<Art>) => void;
  assignPreset: (artId: string, presetId: string) => void;
  assignPresetBulk: (artIds: string[], presetId: string) => void;
  setIpCode: (artId: string, ip: IpCode | null) => void;
  setIpCodeBulk: (artIds: string[], ip: IpCode | null) => void;
  toggleSelect: (id: string) => void;
  selectAll: (value: boolean) => void;
  selectMany: (ids: string[], value: boolean) => void;
  invertSelection: () => void;
  duplicateArt: (id: string) => void;
  duplicateArtsBulk: (ids: string[]) => void;
  clearAllPresets: () => void;
  resetAllIpCodes: () => void;
  searchReplaceArts: (
    search: string,
    replace: string,
    options: { scope: "all" | "selected"; caseSensitive: boolean; exactMatch: boolean },
  ) => number;

  // Actions — presets
  setPresets: (presets: Preset[]) => void;
  upsertPreset: (preset: Preset) => void;
  removePreset: (id: string) => void;
  pushRecentPreset: (presetId: string) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // UI actions
  pushToast: (t: Omit<ToastEntry, "id">) => void;
  dismissToast: (id: string) => void;
  setHelpOpen: (open: boolean) => void;
  setExportProgress: (p: number, status?: string) => void;

  // Derived
  recompute: () => void;
}

let toastCounter = 0;
function toastId(): string {
  toastCounter += 1;
  return `t-${Date.now().toString(36)}-${toastCounter}`;
}

let artCounter = 0;
function newArtId(): string {
  artCounter += 1;
  return `art-${Date.now().toString(36)}-${artCounter}`;
}

/** Check if two arts arrays are structurally equal (ignoring transient fields). */
function artsEqual(a: Art[], b: Art[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.artName !== y.artName || x.presetId !== y.presetId ||
        x.ipCode !== y.ipCode || x.seqOverride !== y.seqOverride ||
        x.material !== y.material || x.category !== y.category) {
      return false;
    }
  }
  return true;
}

const MAX_HISTORY = 50;

function refreshBuiltInPresets(presets: Preset[] = BUILTIN_PRESETS): Preset[] {
  const builtinById = new Map(BUILTIN_PRESETS.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const refreshed = presets.map((preset) => {
    seen.add(preset.id);
    const builtin = builtinById.get(preset.id);
    return builtin ? { ...builtin } : preset;
  });
  for (const builtin of BUILTIN_PRESETS) {
    if (!seen.has(builtin.id)) refreshed.push({ ...builtin });
  }
  return refreshed;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => {
      // Internal helper: commit a new arts state with history tracking.
      function _commit(newArts: Art[]) {
        const { arts: current, past, presets } = get();
        // Skip no-op commits.
        if (artsEqual(current, newArts)) {
          set({ arts: recomputeArtSkus(newArts, presets) });
          return;
        }
        const newPast = [...past, current];
        if (newPast.length > MAX_HISTORY) newPast.shift();
        set({
          arts: recomputeArtSkus(newArts, presets),
          past: newPast,
          future: [], // any new mutation invalidates redo
        });
      }

      return {
        step: "start",
        maxReachedStep: 0,

        project: null,

        arts: [],
        presets: refreshBuiltInPresets(),

        past: [],
        future: [],

        recentPresetIds: [],

        toasts: [],
        helpOpen: false,
        exportProgress: 0,
        exportStatus: "",

        setStep: (step) =>
          set((s) => ({
            step,
            maxReachedStep: Math.max(s.maxReachedStep, STEP_ORDER.indexOf(step)),
          })),

        next: () => {
          const { step } = get();
          const idx = STEP_ORDER.indexOf(step);
          if (idx < STEP_ORDER.length - 1) {
            const nextStep = STEP_ORDER[idx + 1];
            set((s) => ({
              step: nextStep,
              maxReachedStep: Math.max(s.maxReachedStep, idx + 1),
            }));
          }
        },

        prev: () => {
          const { step } = get();
          const idx = STEP_ORDER.indexOf(step);
          if (idx > 0) set({ step: STEP_ORDER[idx - 1] });
        },

        canNext: () => {
          const { step, arts, project } = get();
          const idx = STEP_ORDER.indexOf(step);
          if (idx >= STEP_ORDER.length - 1) return false;
          if (step === "folder") return !!project && arts.length > 0;
          if (step === "scan") return arts.length > 0;
          if (step === "preset") return arts.some((a) => a.presetId);
          return true;
        },

        canPrev: () => STEP_ORDER.indexOf(get().step) > 0,

        startProject: (name, basePath) =>
          set({
            project: {
              name: name || "Новый проект",
              basePath,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            step: "folder",
            maxReachedStep: Math.max(get().maxReachedStep, 1),
          }),

        resetProject: () =>
          set({
            step: "start",
            maxReachedStep: 0,
            project: null,
            arts: [],
            past: [],
            future: [],
            exportProgress: 0,
            exportStatus: "",
          }),

        setArts: (arts) => _commit(arts),

        addArts: (newArts) => _commit([...get().arts, ...newArts]),

        removeArt: (id) => _commit(get().arts.filter((a) => a.id !== id)),

        removeSelected: () => _commit(get().arts.filter((a) => !a.selected)),

        clearArts: () => _commit([]),

        updateArt: (id, patch) => {
          const next = get().arts.map((a) => (a.id === id ? { ...a, ...patch } : a));
          _commit(next);
        },

        assignPreset: (artId, presetId) => {
          get().updateArt(artId, { presetId });
          get().pushRecentPreset(presetId);
        },

        assignPresetBulk: (artIds, presetId) => {
          const idSet = new Set(artIds);
          _commit(get().arts.map((a) => (idSet.has(a.id) ? { ...a, presetId } : a)));
          get().pushRecentPreset(presetId);
        },

        setIpCode: (artId, ip) => get().updateArt(artId, { ipCode: ip }),

        setIpCodeBulk: (artIds, ip) => {
          const idSet = new Set(artIds);
          _commit(get().arts.map((a) => (idSet.has(a.id) ? { ...a, ipCode: ip } : a)));
        },

        toggleSelect: (id) => {
          // Selection changes are NOT undoable.
          set({
            arts: get().arts.map((a) =>
              a.id === id ? { ...a, selected: !a.selected } : a,
            ),
          });
        },

        selectAll: (value) => {
          set({ arts: get().arts.map((a) => ({ ...a, selected: value })) });
        },

        selectMany: (ids, value) => {
          const idSet = new Set(ids);
          set({
            arts: get().arts.map((a) =>
              idSet.has(a.id) ? { ...a, selected: value } : a,
            ),
          });
        },

        invertSelection: () => {
          set({ arts: get().arts.map((a) => ({ ...a, selected: !a.selected })) });
        },

        duplicateArt: (id) => {
          const { arts } = get();
          const src = arts.find((a) => a.id === id);
          if (!src) return;
          const copy: Art = {
            ...src,
            id: newArtId(),
            artName: `${src.artName}_copy`,
            selected: false,
            createdAt: Date.now(),
          };
          const idx = arts.findIndex((a) => a.id === id);
          _commit([...arts.slice(0, idx + 1), copy, ...arts.slice(idx + 1)]);
        },

        duplicateArtsBulk: (ids) => {
          const idSet = new Set(ids);
          const { arts } = get();
          const next: Art[] = [];
          for (const a of arts) {
            next.push(a);
            if (idSet.has(a.id)) {
              next.push({
                ...a,
                id: newArtId(),
                artName: `${a.artName}_copy`,
                selected: false,
                createdAt: Date.now(),
              });
            }
          }
          _commit(next);
        },

        clearAllPresets: () => _commit(get().arts.map((a) => ({ ...a, presetId: "" }))),

        resetAllIpCodes: () => _commit(get().arts.map((a) => ({ ...a, ipCode: null }))),

        searchReplaceArts: (search, replace, options) => {
          if (!search) return 0;
          const { arts } = get();
          let count = 0;
          const flags = options.caseSensitive ? "g" : "gi";
          const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const pattern = options.exactMatch
            ? new RegExp(`^${escaped}$`, flags)
            : new RegExp(escaped, flags);
          const next = arts.map((a) => {
            if (options.scope === "selected" && !a.selected) return a;
            const newName = a.artName.replace(pattern, replace);
            if (newName !== a.artName) {
              count += 1;
              return { ...a, artName: newName };
            }
            return a;
          });
          if (count > 0) _commit(next);
          return count;
        },

        setPresets: (presets) => {
          const { arts } = get();
          const next = refreshBuiltInPresets(presets);
          set({ arts: recomputeArtSkus(arts, next), presets: next });
        },

        upsertPreset: (preset) => {
          const { presets, arts } = get();
          const exists = presets.some((p) => p.id === preset.id);
          const next = exists
            ? presets.map((p) => (p.id === preset.id ? preset : p))
            : [...presets, preset];
          set({ arts: recomputeArtSkus(arts, next), presets: next });
        },

        removePreset: (id) => {
          const { presets, arts } = get();
          const next = presets.filter((p) => p.id !== id);
          const cleared = arts.map((a) =>
            a.presetId === id ? { ...a, presetId: "" } : a,
          );
          set({ arts: recomputeArtSkus(cleared, next), presets: next });
        },

        pushRecentPreset: (presetId) => {
          if (!presetId) return;
          set((s) => ({
            recentPresetIds: [
              presetId,
              ...s.recentPresetIds.filter((id) => id !== presetId),
            ].slice(0, 5),
          }));
        },

        undo: () => {
          const { past, arts, future } = get();
          if (past.length === 0) return;
          const previous = past[past.length - 1];
          const newPast = past.slice(0, -1);
          const { presets } = get();
          set({
            arts: recomputeArtSkus(previous, presets),
            past: newPast,
            future: [arts, ...future].slice(0, MAX_HISTORY),
          });
        },

        redo: () => {
          const { future, arts, past } = get();
          if (future.length === 0) return;
          const nextArts = future[0];
          const newFuture = future.slice(1);
          const { presets } = get();
          set({
            arts: recomputeArtSkus(nextArts, presets),
            past: [...past, arts].slice(-MAX_HISTORY),
            future: newFuture,
          });
        },

        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,

        clearHistory: () => set({ past: [], future: [] }),

        pushToast: (t) => {
          const id = toastId();
          set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
          setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
          }, 4000);
        },

        dismissToast: (id) =>
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

        setHelpOpen: (open) => set({ helpOpen: open }),

        setExportProgress: (p, status) =>
          set({
            exportProgress: Math.max(0, Math.min(100, p)),
            exportStatus: status ?? get().exportStatus,
          }),

        recompute: () => {
          const { arts, presets } = get();
          set({ arts: recomputeArtSkus(arts, presets) });
        },
      };
    },
    {
      name: "printcardflow-wizard",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        step: s.step,
        project: s.project,
        arts: s.arts,
        presets: s.presets,
        maxReachedStep: s.maxReachedStep,
        recentPresetIds: s.recentPresetIds,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<WizardState>;
        const presets = refreshBuiltInPresets(
          persistedState.presets ?? current.presets,
        );
        const arts = recomputeArtSkus(persistedState.arts ?? current.arts, presets);
        return {
          ...current,
          ...persistedState,
          presets,
          arts,
          past: [],
          future: [],
          toasts: [],
        } as WizardState;
      },
    },
  ),
);
