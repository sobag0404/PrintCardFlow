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

  // UI
  toasts: ToastEntry[];
  helpOpen: boolean;
  exportProgress: number; // 0..100
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
  duplicateArt: (id: string) => void;

  // Actions — presets
  setPresets: (presets: Preset[]) => void;
  upsertPreset: (preset: Preset) => void;
  removePreset: (id: string) => void;

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
function artId(): string {
  artCounter += 1;
  return `art-${Date.now().toString(36)}-${artCounter}`;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      step: "start",
      maxReachedStep: 0,

      project: null,

      arts: [],
      presets: BUILTIN_PRESETS,

      toasts: [],
      helpOpen: false,
      exportProgress: 0,
      exportStatus: "",

      setStep: (step) =>
        set((s) => {
          const idx = STEP_ORDER.indexOf(step);
          return {
            step,
            maxReachedStep: Math.max(s.maxReachedStep, idx),
          };
        }),

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
        if (idx > 0) {
          set({ step: STEP_ORDER[idx - 1] });
        }
      },

      canNext: () => {
        const { step, arts, project } = get();
        const idx = STEP_ORDER.indexOf(step);
        if (idx >= STEP_ORDER.length - 1) return false;
        // Step guards
        if (step === "folder") return !!project && arts.length > 0;
        if (step === "scan") return arts.length > 0;
        if (step === "preset") return arts.some((a) => a.presetId);
        return true;
      },

      canPrev: () => {
        const { step } = get();
        return STEP_ORDER.indexOf(step) > 0;
      },

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
          exportProgress: 0,
          exportStatus: "",
        }),

      setArts: (arts) => {
        const { presets } = get();
        set({ arts: recomputeArtSkus(arts, presets) });
      },

      addArts: (newArts) => {
        const { arts, presets } = get();
        set({ arts: recomputeArtSkus([...arts, ...newArts], presets) });
      },

      removeArt: (id) => {
        const { arts, presets } = get();
        set({ arts: recomputeArtSkus(arts.filter((a) => a.id !== id), presets) });
      },

      removeSelected: () => {
        const { arts, presets } = get();
        set({ arts: recomputeArtSkus(arts.filter((a) => !a.selected), presets) });
      },

      clearArts: () => set({ arts: [] }),

      updateArt: (id, patch) => {
        const { arts, presets } = get();
        const next = arts.map((a) => (a.id === id ? { ...a, ...patch } : a));
        set({ arts: recomputeArtSkus(next, presets) });
      },

      assignPreset: (artId, presetId) => {
        get().updateArt(artId, { presetId });
      },

      assignPresetBulk: (artIds, presetId) => {
        const { arts, presets } = get();
        const idSet = new Set(artIds);
        const next = arts.map((a) =>
          idSet.has(a.id) ? { ...a, presetId } : a,
        );
        set({ arts: recomputeArtSkus(next, presets) });
      },

      setIpCode: (artId, ip) => {
        get().updateArt(artId, { ipCode: ip });
      },

      setIpCodeBulk: (artIds, ip) => {
        const { arts, presets } = get();
        const setIds = new Set(artIds);
        const next = arts.map((a) =>
          setIds.has(a.id) ? { ...a, ipCode: ip } : a,
        );
        set({ arts: recomputeArtSkus(next, presets) });
      },

      toggleSelect: (id) => {
        const { arts } = get();
        set({
          arts: arts.map((a) =>
            a.id === id ? { ...a, selected: !a.selected } : a,
          ),
        });
      },

      selectAll: (value) => {
        const { arts } = get();
        set({ arts: arts.map((a) => ({ ...a, selected: value })) });
      },

      duplicateArt: (id) => {
        const { arts, presets } = get();
        const src = arts.find((a) => a.id === id);
        if (!src) return;
        const copy: Art = {
          ...src,
          id: artId(),
          artName: `${src.artName}_copy`,
          selected: false,
          createdAt: Date.now(),
        };
        const idx = arts.findIndex((a) => a.id === id);
        const next = [...arts.slice(0, idx + 1), copy, ...arts.slice(idx + 1)];
        set({ arts: recomputeArtSkus(next, presets) });
      },

      setPresets: (presets) => {
        const { arts } = get();
        set({ arts: recomputeArtSkus(arts, presets), presets });
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
        // Unassign arts that referenced the removed preset.
        const cleared = arts.map((a) =>
          a.presetId === id ? { ...a, presetId: "" } : a,
        );
        set({ arts: recomputeArtSkus(cleared, next), presets: next });
      },

      pushToast: (t) => {
        const id = toastId();
        set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
        // Auto-dismiss after 4s.
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
    }),
    {
      name: "printcardflow-wizard",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        project: s.project,
        arts: s.arts,
        presets: s.presets,
        maxReachedStep: s.maxReachedStep,
      }),
    },
  ),
);
