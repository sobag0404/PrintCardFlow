// PrintCardFlow — Sticky glass header.
"use client";

import * as React from "react";
import { Github, HelpCircle, Layers, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ThemeToggle } from "./theme-toggle";
import { StepProgress, StepProgressMobile } from "./step-progress";
import { SettingsDialog } from "./settings-dialog";
import { HelpDialog } from "./help-dialog";
import { useWizardStore } from "@/lib/store/wizard-store";

export function AppHeader() {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const project = useWizardStore((s) => s.project);
  const setHelpOpen = useWizardStore((s) => s.setHelpOpen);

  return (
    <header className="glass sticky top-0 z-40 w-full border-b border-border/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:px-6">
        {/* Left: logo + wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="relative grid size-8 place-items-center rounded-lg bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-500 text-white shadow-lg shadow-rose-500/20">
            <Layers className="size-4" />
            <span className="absolute -inset-0.5 -z-10 rounded-lg bg-gradient-to-br from-fuchsia-500/40 to-amber-500/40 blur-md" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="pcf-gradient-text text-base font-bold tracking-tight">
              PrintCardFlow
            </span>
            <span className="text-[10px] text-muted-foreground">SKU generator</span>
          </div>
        </div>

        {/* Center: step progress (desktop) */}
        <div className="hidden flex-1 items-center justify-center md:flex">
          <StepProgress />
        </div>

        {/* Mobile: compact step indicator */}
        <div className="flex flex-1 items-center justify-center md:hidden">
          <StepProgressMobile />
        </div>

        {/* Right: project + actions */}
        <div className="flex items-center gap-1.5">
          {project && (
            <Badge
              variant="outline"
              className="hidden max-w-[180px] truncate border-border/70 bg-background/60 font-medium sm:inline-flex"
              title={project.name}
            >
              {project.name}
            </Badge>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="pcf-focus"
                onClick={() => setHelpOpen(true)}
                aria-label="Подсказки и горячие клавиши"
              >
                <HelpCircle className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Подсказки (Ctrl+/)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="pcf-focus"
                onClick={() => setSettingsOpen(true)}
                aria-label="Настройки"
              >
                <Settings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Настройки</TooltipContent>
          </Tooltip>
          <ThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="pcf-focus hidden sm:inline-flex"
                asChild
              >
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="GitHub репозиторий"
                >
                  <Github className="size-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>GitHub</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <HelpDialog />
    </header>
  );
}
