# Task ID: Q — Shared shell + wizard steps

## Agent
full-stack-developer (Shared shell + wizard steps)

## Scope
Built the complete shared shell components (18 files), the validation module, the keyboard shortcuts hook, and all 6 wizard step screens for PrintCardFlow.

## Files created

### Validation
- `src/lib/domain/validation.ts` — pure module: `validateArtName`, `detectDuplicateSkus`, `detectDuplicateArtNames`, `validateProject` (combines all + artsWithoutPreset + artsWithInvalidNames), `pluralRu` RU plural-aware noun helper. Exposes `ProjectValidationResult` with `hasErrors`/`hasWarnings`/`summary`.

### Shared shell (`src/components/shared/`)
- `theme-provider.tsx` — next-themes wrapper (attribute="class", defaultTheme="dark", enableSystem, disableTransitionOnChange).
- `theme-toggle.tsx` — Light/Dark/System dropdown with Framer Motion Sun/Moon swap (AnimatePresence, hydration-safe via mounted flag).
- `app-header.tsx` — sticky glass header: Layers logo + gradient wordmark, StepProgress center (desktop) / StepProgressMobile (mobile), project badge, Help/Settings buttons, ThemeToggle, GitHub link.
- `step-progress.tsx` — 6-step horizontal stepper with 4 states (completed→check, current→ring+pulse, reachable, locked→lock). Exports `StepProgress` (desktop) and `StepProgressMobile` (compact).
- `app-footer.tsx` — `mt-auto` sticky footer: v2.0 + GitHub (left), ShortcutCheatsheet (center), arts/SKU count stats (right, visible on preset/preview/export steps).
- `toast-stack.tsx` — fixed top-right AnimatePresence stack reading `useWizardStore.toasts`. Variant-colored borders + icons (Info/Check/Alert/X), hover pause, CSS countdown progress bar.
- `help-dialog.tsx` — Dialog bound to `helpOpen`. Shortcuts table (Alt+→/←, Ctrl+Z/Y/Shift+Z, Ctrl+/, Ctrl+S/E/D, Esc) + SKU format explanation with color-coded segments.
- `undo-redo-controls.tsx` — Undo2/Redo2 icon buttons with history-depth badges, tooltips, disabled when !canUndo/!canRedo, toast on action.
- `validation-banner.tsx` — reads arts+presets, runs `validateProject`. Collapsible with Framer Motion expand. OK (emerald) / error (rose, duplicate SKU list) / warning (amber, arts without preset) tones. Auto-expand on first error.
- `shortcut-cheatsheet.tsx` — Popover with all 10 keyboard shortcuts as kbd chips, triggered by Keyboard icon button (footer).
- `settings-dialog.tsx` — Dialog with 3 sections: Экспорт (default format Select, filename template Input with live preview, autoLog/showToast/defaultManifest Switches), Внешний вид (theme RadioGroup with 3 options), Сброс (destructive reset with confirmation). Reads/writes `usePreferencesStore`.
- `loading-button.tsx` — shadcn Button wrapper with `loading`+`loadingText` props (spinner + aria-busy + disabled). Uses `React.ComponentProps<typeof Button>` to avoid ButtonProps export issue.
- `empty-state.tsx` — reusable: icon (in accent-tinted square with float animation), title, description, optional action. 6 accent variants. `bare` mode for nested use.
- `skeletons.tsx` — `ArtRowSkeleton`, `ArtRowSkeletonList(count)`, `StatsCardSkeleton`, `ExportCardSkeleton`, `HistoryItemSkeleton`. Use `.pcf-shimmer-bg` class.
- `animated-number.tsx` — count-up via `useCountUp` hook (rAF, easeOutCubic, prefers-reduced-motion respect). `<AnimatedNumber value duration format/>`.
- `search-replace-dialog.tsx` — Dialog with Найти/Заменить inputs, scope RadioGroup (all/selected), case-sensitive + exact-match checkboxes, live preview (first 5 matches + count), "Заменить все" → `searchReplaceArts` + toast.
- `project-manager.tsx` — `SaveProjectButton` (toolbar) + `SavedProjectsCard` (start screen) + `SaveProjectDialog`. Save → POST /api/sessions, Load → GET /api/sessions/[id] → setPresets + setArts + startProject, Delete → DELETE /api/sessions/[id]. AnimatePresence list with loading/deleting spinners.
- `export-history-panel.tsx` — collapsible. Fetches GET /api/export-history. List with kind icon (color-coded per format), filename (mono + tooltip), stats badges, size, relative timestamp. "Скачать снова" (GET redownload → blob) + "Удалить" (DELETE). Empty state. Loading skeleton. Auto-fetches on first open.

### Hooks (`src/hooks/`)
- `use-keyboard-shortcuts.ts` — global keydown handler: Alt+→/← (next/prev, ignores inputs), Ctrl+Z (undo, works in inputs), Ctrl+Y / Ctrl+Shift+Z (redo, works in inputs), Ctrl+/ (toggle help), Ctrl+S (triggerDefaultExport), Ctrl+E (triggerZipExport), Ctrl+D (onDuplicate or bulk duplicate selected), Esc (close help or onEscape). Includes Cyrillic layout fallback map (я→z, н→y, .→/).

### Wizard steps (`src/components/wizard/`)
- `step-heading.tsx` — exported `StepHeading` (icon tile + title + subtitle) with 6 accent variants.
- `wizard-footer-nav.tsx` — exported `WizardFooterNav` (Назад + gradient Далее with optional onNext/onPrev, rightExtra slot, loading state) and `StepContainer` (motion enter animation wrapper).
- `step-start.tsx` — Hero: aurora orb with glow + float animation, gradient headline, version pill. 4-card feature grid (6 пресетов / Excel / ZIP / Горячие клавиши) with accent tiles + sliding chevrons. 3 CTAs (Начать новый / Продолжить / Галерея). SavedProjectsCard below. SKU format hint.
- `step-folder.tsx` — StepHeading (FolderSearch). Path input (pcf-mono, prefilled from project or DEMO_BASE_PATHS[0]). Quick-pick chips (last path segment). Count Select (10/30/50/100/200). "Сканировать" LoadingButton → POST /api/scan-folder → setArts + startProject + next. "Выбрать файл" hidden input → POST /api/excel-import (FormData) → map rows to Arts → setArts + next. Collapsible detected-columns preview with warnings. Right sidebar: step-by-step tips + веб-демо warning.
- `step-scan.tsx` — Stats (AnimatedNumber, 3 MiniStat cards) + toolbar (search, select-all-visible, invert, delete-selected). Scrollable list (max-h-[60vh] scroll-pcf) with Checkbox/mono name/muted source/Trash2. AnimatePresence. Empty state. Footer nav.
- `step-preset.tsx` — CORE step. Two-column (lg:grid-cols-[1fr_18rem]). Left: dnd-kit sortable art table (PointerSensor+KeyboardSensor, drag handle, checkbox, art name, preset Select with accent dots, IP Select pcf-mono, SKU preview with tooltip showing all SKUs, duplicate/delete). Exports `ART_ROW_GRID` constant. Toolbar Row1 = search + UndoRedoControls + SaveProjectButton + "Поиск и замена" button. Row2 = Selection group (Все/Снять/Инвертировать/по пресету Select+Выбрать) + Edit group (Дублировать N/Сбросить IP/Очистить пресеты AlertDialog/Удалить N). Bulk IP bar with violet accent. Right: 3 stats MiniStat cards + RecentPresetsBar (chips with accent dots) + preset palette (chips with pulse dot + accent glow, click → assignPresetBulk) + disabled Галерея button. ValidationBanner at top. Footer nav. max-h-[55vh] scroll-pcf.
- `step-preview.tsx` — Virtualized table with @tanstack/react-virtual. Flattens to FlatRow[] (art-header + sku). useVirtualizer (estimateSize 44/40, overscan 8, translateY absolute positioning). 8-column CSS grid alignment. Sticky header. Summary cards (4 AnimatedNumber, pcf-stat-card). Search + preset filter Select + expand/collapse all. Copy-to-clipboard per SKU (button row → toast). ValidationBanner. Empty state. Toggle collapse per art.
- `step-export.tsx` — Summary stats (4 AnimatedNumber). 2 primary cards (Excel emerald / ZIP violet, structurally identical, accent on icon tile + download pill, pcf-card-hover, motion lift on hover). Manifest checkbox (defaults from preferences). "Дополнительные форматы" section with 3 QuickExportButtons (CSV emerald / JSON amber / TXT violet, per-accent borders + tiles). Progress bar bound to exportProgress/exportStatus. ExportHistoryPanel. Footer: "Назад" + "Начать заново" (AlertDialog confirm → resetProject).

## Verification
- `bun run lint`: 0 errors, 1 warning (unactionable `react-hooks/incompatible-library` from `useVirtualizer` in step-preview — this is a TanStack Virtual library quirk, not our code).
- `npx tsc --noEmit` on our files: clean (no errors in src/components, src/hooks, or src/lib/domain/validation).
- Dev server log shows API routes responding correctly (all 12 routes return 200).
- All components use `"use client"` directive where needed.
- All Russian labels in place; accent palette only (no indigo/blue).
- Sticky footer (`mt-auto` on AppFooter), responsive grid layouts, focus rings (pcf-focus), Framer Motion transitions throughout.

## Notes for downstream agents (R, S)
- `AppHeader`, `AppFooter`, `ToastStack`, `ThemeProvider` are ready to wire into `app/layout.tsx` and `app/page.tsx`.
- `useKeyboardShortcuts` hook must be invoked from a top-level client component (likely page.tsx); it has no required options (defaults to bulk-duplicate on Ctrl+D).
- `StepContainer` provides motion enter/exit; wrap each step component with `<AnimatePresence mode="wait">` in page.tsx for smooth transitions.
- `WizardFooterNav` accepts optional `onNext`, `onPrev`, `nextDisabled`, `nextLoading`, `nextLoadingText`, `rightExtra` — used by step-folder (loading) and step-export (AlertDialog reset).
- The wizard step components do NOT call `useKeyboardShortcuts` themselves — that's the page's job.
- `ValidationBanner` is safe to render on preset/preview/export steps; returns null when arts.length === 0.
- `SaveProjectButton` (toolbar trigger) and `SavedProjectsCard` (start-screen list) are independent — use both as needed.
- `ExportHistoryPanel` is self-contained (fetches on first open, handles its own loading/empty states).
- Design system classes referenced: `.glass`, `.glass-strong`, `.pcf-mono`, `.pcf-focus`, `.scroll-pcf`, `.pcf-aurora`, `.pcf-accent-{amber,rose,pink,fuchsia,emerald,violet}`, `.pcf-step-connector` (used as `pcf-step connector`), `.pcf-divider`, `.pcf-stat-card`, `.pcf-stat-number`, `.pcf-toolbar`, `.pcf-card-hover`, `.pcf-glow`, `.pcf-gradient-text`, `.pcf-text-balance`, `.pcf-shimmer-bg`, `.pcf-section-label`, `.pcf-accent-dot`, `.pcf-empty-icon`. Subagent R must define these in globals.css.
