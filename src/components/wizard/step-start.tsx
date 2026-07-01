// PrintCardFlow — Step "Start": hero + feature grid + CTAs + saved projects.
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  FileSpreadsheet,
  FolderOpen,
  Keyboard,
  Layers,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWizardStore } from "@/lib/store/wizard-store";
import { BUILTIN_PRESETS } from "@/lib/domain/presets";
import { SavedProjectsCard } from "@/components/shared/project-manager";
import { useLowPowerMode } from "@/lib/performance-mode";
import { StepContainer } from "./wizard-footer-nav";

const FEATURES = [
  {
    icon: Layers,
    title: "6 пресетов",
    description: "Одеяло, подушки, одиночный — с гибкими размерами и IP-кодами.",
    accent: "pcf-accent-amber",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel-импорт",
    description: "Загрузите существующий реестр и продолжите с того же места.",
    accent: "pcf-accent-emerald",
  },
  {
    icon: FolderOpen,
    title: "ZIP-экспорт",
    description: "Манифест, README и все форматы в одном архиве.",
    accent: "pcf-accent-violet",
  },
  {
    icon: Keyboard,
    title: "Горячие клавиши",
    description: "Alt+←/→, Ctrl+Z/Y, Ctrl+S/E/D — работайте без мыши.",
    accent: "pcf-accent-rose",
  },
] as const;

export function StepStart() {
  const startProject = useWizardStore((s) => s.startProject);
  const setStep = useWizardStore((s) => s.setStep);
  const project = useWizardStore((s) => s.project);
  const arts = useWizardStore((s) => s.arts);
  const lowPower = useLowPowerMode();

  const hasProject = !!project && arts.length > 0;

  return (
    <StepContainer className="gap-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 px-6 py-12 sm:px-12 sm:py-16">
        {/* Aurora orb */}
        <div
          aria-hidden
          className="pcf-aurora pointer-events-none absolute inset-0"
        />
        <div className="relative flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="pcf-glow relative mb-6 grid size-20 place-items-center rounded-3xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-500 text-white shadow-2xl shadow-rose-500/30"
          >
            <Sparkles className="size-9" />
            {!lowPower && (
              <motion.span
                aria-hidden
                className="absolute -inset-2 -z-10 rounded-3xl bg-gradient-to-br from-fuchsia-500/40 to-amber-500/40 blur-2xl"
                animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="pcf-text-balance text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            <span className="pcf-gradient-text">PrintCardFlow</span>
            <br />
            <span className="text-foreground">Генератор SKU для печати</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mt-4 max-w-xl text-sm text-muted-foreground pcf-text-balance sm:text-base"
          >
            Сканируйте папку, назначайте пресеты, валидируйте дубликаты и
            экспортируйте готовые SKU в Excel, ZIP, CSV, JSON или TXT.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="mt-5"
          >
            <Badge
              variant="outline"
              className="border-border/70 bg-background/60 px-3 py-1 text-xs font-medium"
            >
              <Sparkles className="size-3 mr-1" />
              v2.0 · Web build
            </Badge>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              className="pcf-focus bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20 hover:opacity-90"
              onClick={() => startProject("Новый проект", "/demo/arts")}
            >
              <PlayCircle className="size-4" />
              Начать новый проект
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="pcf-focus"
              disabled={!hasProject}
              onClick={() => setStep(hasProject ? "scan" : "folder")}
            >
              <ArrowRight className="size-4" />
              Продолжить
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="pcf-focus"
              onClick={() => useWizardStore.getState().setStep("folder")}
            >
              <FolderOpen className="size-4" />
              Галерея шаблонов
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.05, duration: 0.3 }}
                className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 transition-all hover:border-foreground/30 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`grid size-10 shrink-0 place-items-center rounded-lg ${f.accent}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{f.title}</div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                  <motion.div
                    className="text-muted-foreground"
                    initial={false}
                    whileHover={{ x: 4 }}
                  >
                    <ChevronRight className="size-4" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Saved projects */}
      <section>
        <SavedProjectsCard />
      </section>

      {/* Presets count hint */}
      <section className="text-center text-xs text-muted-foreground">
        Встроенных пресетов:{" "}
        <span className="font-semibold text-foreground">
          {BUILTIN_PRESETS.length}
        </span>{" "}
        · SKU-формат:{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 pcf-mono text-[11px]">
          ArtName_001_Size_Material_Category_IP
        </code>
      </section>
    </StepContainer>
  );
}
