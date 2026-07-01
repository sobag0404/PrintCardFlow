// PrintCardFlow — Project manager (save/load/delete sessions).
"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FolderOpen,
  Save,
  Trash2,
  Calendar,
  Clock,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useWizardStore } from "@/lib/store/wizard-store";
import { cn } from "@/lib/utils";

interface SessionListItem {
  id: string;
  name: string;
  artsCount: number;
  skuCount: number;
  updatedAt: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────────────────────
// SaveProjectButton — toolbar trigger
// ─────────────────────────────────────────────────────────────
export function SaveProjectButton({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("pcf-focus", className)}
            onClick={() => setOpen(true)}
          >
            <Save className="size-3.5" />
            <span className="hidden sm:inline">Сохранить</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Сохранить проект (сессию)</TooltipContent>
      </Tooltip>
      <SaveProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SaveProjectDialog — name input + save
// ─────────────────────────────────────────────────────────────
export function SaveProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const arts = useWizardStore((s) => s.arts);
  const presets = useWizardStore((s) => s.presets);
  const project = useWizardStore((s) => s.project);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setName(project?.name || "Новый проект");
    });

    return () => {
      cancelled = true;
    };
  }, [open, project]);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, arts, presets }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      pushToast({
        variant: "success",
        title: "Проект сохранён",
        description: data.session?.name ?? name,
      });
      onOpenChange(false);
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Ошибка сохранения",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="size-4" />
            Сохранить проект
          </DialogTitle>
          <DialogDescription>
            Проект сохраняется в локальную базу. Имя должно быть уникальным.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="sp-name">Имя проекта</Label>
          <Input
            id="sp-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Мой проект"
            autoFocus
          />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Артов: {arts.length}</span>
            <span>·</span>
            <span>Пресетов: {presets.length}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// SavedProjectsCard — start screen card
// ─────────────────────────────────────────────────────────────
export function SavedProjectsCard() {
  const setArts = useWizardStore((s) => s.setArts);
  const setPresets = useWizardStore((s) => s.setPresets);
  const startProject = useWizardStore((s) => s.startProject);
  const pushToast = useWizardStore((s) => s.pushToast);

  const [sessions, setSessions] = React.useState<SessionListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void refresh();
    });

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const onLoad = async (id: string, name: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const session = data.session;
      if (!session) throw new Error("Сессия не найдена");
      setPresets(session.presets ?? []);
      setArts(session.arts ?? []);
      startProject(name, session.basePath || "/restored");
      pushToast({
        variant: "success",
        title: "Проект загружен",
        description: name,
      });
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Ошибка загрузки",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoadingId(null);
    }
  };

  const onDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      pushToast({
        variant: "default",
        title: "Сессия удалена",
        description: name,
      });
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Ошибка удаления",
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/50 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Загрузка сохранённых проектов…
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <FolderOpen className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Сохранённые проекты</h3>
        <Badge variant="secondary" className="ml-auto">{sessions.length}</Badge>
      </div>
      <ul className="space-y-2 max-h-72 overflow-y-auto scroll-pcf pr-1">
        <AnimateList
          sessions={sessions}
          loadingId={loadingId}
          deletingId={deletingId}
          onLoad={onLoad}
          onDelete={onDelete}
        />
      </ul>
    </div>
  );
}

function AnimateList({
  sessions,
  loadingId,
  deletingId,
  onLoad,
  onDelete,
}: {
  sessions: SessionListItem[];
  loadingId: string | null;
  deletingId: string | null;
  onLoad: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  return (
    <>
      <AnimatePresence>
        {sessions.map((s) => (
          <motion.li
            key={s.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3 rounded-lg border bg-background/60 p-2.5"
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{s.name}</div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="size-3" />
                  {s.artsCount} арт · {s.skuCount} SKU
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {formatDate(s.updatedAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatTime(s.updatedAt)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                disabled={loadingId === s.id}
                onClick={() => onLoad(s.id, s.name)}
              >
                {loadingId === s.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FolderOpen className="size-3.5" />
                )}
                <span className="hidden sm:inline">Открыть</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                disabled={deletingId === s.id}
                onClick={() => onDelete(s.id, s.name)}
                aria-label={`Удалить ${s.name}`}
              >
                {deletingId === s.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </Button>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </>
  );
}
