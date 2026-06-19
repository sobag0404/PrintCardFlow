# Task ID: R — Preset/art components + page + globals

## Agent
full-stack-developer (Preset/art components + page + globals)

## Scope
Built all preset components (6 files), art components (4 files), template gallery data module, and rewired app/layout.tsx + app/page.tsx + globals.css to wire everything together with the design system Subagent Q's components reference.

## Files created

### Template gallery data
- `src/lib/domain/template-gallery.ts` — 5 curated bundles (textile-basic/amber, wb-pillows/rose, kids/emerald, minimal/violet, premium/fuchsia) totaling 17 presets. Stable ids `tpl-{bundleId}-{n}`. Exports `GALLERY_CATEGORIES` (6), `GALLERY_BUNDLES`, `getBundleById`, `bundleToTemplateBundle`.

### Preset components (`src/components/preset/`)
- `preset-template-io.ts` — Pure Zod v4 module. Schemas: `sizeEntrySchema`, `presetSchema` (PresetKind enum: blanket/pillow-nav/pillow-multi/pillow-sizes/single/custom), `templateBundleSchema` (version literal 1), each `satisfies z.ZodType<T>`. Functions: `serializePresets`, `parseTemplateBundle` (safeParse + RU error), `downloadPresetTemplate`, `readPresetTemplateFile`.
- `preset-chip.tsx` — `PresetChip`. Two modes: `compact` (dot + name, motion.button) and full (accent dot + name + "свой" badge for kind=custom + material·category meta + size-count Badge + IP badge + hover pencil edit). role="button" + tabindex={0} + Enter/Space handler. Framer Motion hover/tap. Uses `.pcf-accent-{accent}` + `.pcf-accent-glow` + `.pcf-accent-dot`.
- `recent-presets-bar.tsx` — `RecentPresetsBar`. Reads `recentPresetIds` + `presets` from store. AnimatePresence stagger. pcf-section-label "Недавно использованные". Hidden when empty. Compact chips (PresetChip compact mode).
- `preset-palette.tsx` — `PresetPalette`. Glass container. Header: title + count Badge + "Создать свой" + "Галерея" buttons. Search Input (visible when presets>4). Responsive grid (1 col mobile / 2 cols sm+). AnimatePresence stagger. Click → toast warning when selectedCount===0 else `onAssign(preset.id)`. Renders PresetEditor + PresetGallery dialogs.
- `preset-editor.tsx` — `PresetEditor`. Dialog with form: Name + Kind Select, Description Textarea, Material + Category Inputs, Accent Select (live dot via ACCENT_DOT map) + Icon Select (8 lucide icons: BedDouble/Square/Layers/Rows3/Circle/Settings2/Sparkles/Crown), IP Switch, dynamic Sizes editor (add/remove rows: label Input + seqScope Input + delete button, min 1 row). Validation (name required, ≥1 size, no empty labels/scopes) → inline error messages. Save → upsertPreset + toast. Delete (non-builtin only) via AlertDialog. Export via `downloadPresetTemplate`. Import via hidden file input → `readPresetTemplateFile` → merge by id → setPresets. Live preview chip via PresetChip. Builtin badge.
- `preset-gallery.tsx` — `PresetGallery`. Dialog "Галерея шаблонов пресетов". Layout: sidebar (desktop vertical, mobile horizontal scrollable tabs) with GALLERY_CATEGORIES + counts. Search Input. Bundle card grid: icon tile (pcf-accent-{accent}) + dot + name + count Badge + category Badge + description + expandable preview (AnimatePresence height auto) showing PresetChips with Tooltip + "Импортировать" button. AlertDialog with "Заменить мои" / "Добавить к моим" actions → setPresets. Bundle icon registry maps bundle.icon (string) to lucide component.

### Art components (`src/components/art/`)
- `sku-badge.tsx` — `SkuBadge`. Emerald mono chip. `showCopy` prop (default true). Click → navigator.clipboard.writeText with execCommand fallback → toast "SKU скопирован" → Check icon swap for 1.2s. When showCopy=false, renders as `<span>` (no click). title={sku}. truncate. aria-label for screen readers.
- `ip-code-badge.tsx` — `IpCodeBadge`. Mono violet badge. Tooltip shows ipCodeMeta.description. "—" muted span for empty code.
- `art-row.tsx` — `ArtRow`. dnd-kit `useSortable`. Exports `ART_ROW_GRID` (7-col CSS grid: `24px_24px_minmax(0,1fr)_180px_120px_minmax(0,1fr)_72px`). Drag handle (GripVertical, cursor-grab, disabled when disableDrag prop). Checkbox. Mono art name + muted source. Preset Select (accent dots in trigger + items). IP Select (mono). SKU preview cell (SkuBadge showCopy={false} + Tooltip showing all computedSkus + "+N" Badge when skus.length>1). Duplicate + delete icon buttons. TooltipProvider wrapper. `disableDrag` prop for non-sortable contexts.
- `art-table.tsx` — `ArtTable`. Reusable card. Reads arts/presets from store. Props: filter?, presetFilter?, maxHeight? (default "max-h-[55vh]"), hideSearch?, className?. Internal search Input + preset-filter Select (with "Без пресета" option). Header checkbox (select-all-visible toggle via useWizardStore.setState — preserves ordering). DndContext + SortableContext (verticalListSortingStrategy) + AnimatePresence. Reorder via `arrayMove` over full arts array → setArts. Empty state (EmptyState component). max-h-[55vh] scroll-pcf.

### App wiring
- `src/app/layout.tsx` — Geist + Geist_Mono fonts (latin+cyrillic subsets). ThemeProvider wrapper (attribute="class", defaultTheme="dark", enableSystem, disableTransitionOnChange). Toaster (shadcn) + SonnerToaster (richColors, top-right). RU metadata (title, description, keywords, OG, twitter). html lang="ru" suppressHydrationWarning.
- `src/app/page.tsx` — "use client" root. STEP_COMPONENTS map → renders `StepStart`/`StepFolder`/`StepScan`/`StepPreset`/`StepPreview`/`StepExport` based on `step`. Direction-aware AnimatePresence (forward → slide from right + blur, back → from left + blur) via prevStepRef + custom variants. `useKeyboardShortcuts({ onEscape: clear selection, onDuplicate: bulk duplicate selected })`. Root: `relative flex min-h-screen flex-col` + `.pcf-aurora` fixed -z-10 backdrop. Wires AppHeader + main + AppFooter + ToastStack.

### Globals (`src/app/globals.css`)
Extended the existing 122-line base with ~290 lines of design-system utilities:
- `.glass` / `.glass-strong` (glassmorphism w/ backdrop-blur 12px/20px + saturate)
- `.pcf-aurora` (3 radial-gradient orbs + pcf-float keyframe)
- `.pcf-mono` (font-geist-mono + tabular-nums)
- `.pcf-focus` (2.5px var(--pcf-accent) ring) + global focus-visible rule on a/button/[role=button]/input/select/textarea/[tabindex]/summary
- `.scroll-pcf` (6px thin scrollbar, hover brightens, both Firefox scrollbar-width + WebKit ::-webkit-scrollbar)
- `.pcf-accent-{amber,rose,pink,fuchsia,emerald,violet}` (sets `--pcf-accent` / `--pcf-accent-fg` / `--pcf-accent-soft` CSS vars + tinted bg + colored text, dark-mode overrides)
- `.pcf-accent` (base, placeholder)
- `.pcf-step` / `.connector` / `.pcf-step-connector` (gradient-fade line — both legacy classnames from Q's step-progress.tsx are supported)
- `.pcf-divider` (horizontal gradient fade)
- `.pcf-stat-card` (padding + border + hover bg/border) + `.pcf-stat-number` (text-2xl font-bold tabular-nums)
- `.pcf-toolbar` (tinted bg + padding + rounded + border)
- `.pcf-card-hover` (translateY -2px + shadow on hover)
- `.pcf-glow` (radial box-shadow for hero icon)
- `.pcf-gradient-text` (emerald→teal bg-clip-text)
- `.pcf-text-balance` (text-wrap: balance)
- `.pcf-shimmer-bg` (muted bg + `::after` shimmer with pcf-shimmer keyframe)
- `.pcf-section-label` (uppercase muted + `::before` dot + flex gap)
- `.pcf-accent-glow` (hover shadow using current --pcf-accent)
- `.pcf-accent-dot` (scale on hover)
- `.pcf-empty-icon` (pcf-empty-float keyframe)
- Keyframes: `pcf-float`, `pcf-toast-progress`, `pcf-bob`, `pcf-dot-pulse`, `pcf-empty-float`, `pcf-shimmer`
- `@media (prefers-reduced-motion: reduce)` — disables all animations + transitions globally + specific overrides for `.pcf-aurora`/`.pcf-empty-icon`/`.pcf-shimmer-bg::after`
- Extended `:root` and `.dark` blocks with `--pcf-accent` / `--pcf-accent-fg` / `--pcf-accent-soft` tokens (different values for light vs dark)

## Verification
- `bun run lint`: **0 errors, 1 warning** (pre-existing unactionable `react-hooks/incompatible-library` from `useVirtualizer` in step-preview.tsx — Q's code).
- `npx tsc --noEmit`: my files clean. Remaining TS errors are pre-existing in P's API routes (Buffer vs BodyInit mismatch in excel-export/zip-export/redownload) and exceljs-lib.ts — not from R's files.
- Dev server log: `GET / 200 in 874ms (compile: 605ms, render: 269ms)` after all edits.

## Notes for downstream agents (S)
- All preset components (`PresetChip`, `PresetPalette`, `PresetEditor`, `PresetGallery`, `RecentPresetsBar`) are exported from `@/components/preset/*` and are ready to be used as drop-in replacements for the inline chip UIs in step-preset.tsx (which still works as-is — its inline chips remain valid; my reusable components can be swapped in if desired).
- All art components (`ArtRow`, `ArtTable`, `SkuBadge`, `IpCodeBadge`) are exported from `@/components/art/*`. `ART_ROW_GRID` is exported from both `art-row.tsx` (new) and `step-preset.tsx` (Q's existing constant) — they are identical strings, so either source works.
- The `preset-template-io.ts` module is pure (no React) and can be safely imported by server-side code or tests.
- The `template-gallery.ts` module is also pure — bundles are static data, safe to import anywhere.
- All design-system classes referenced by Q's shared shell + wizard steps are now defined in globals.css: `.glass`, `.glass-strong`, `.pcf-mono`, `.pcf-focus`, `.scroll-pcf`, `.pcf-aurora`, `.pcf-accent-{amber,rose,pink,fuchsia,emerald,violet}`, `.pcf-step` / `.connector` / `.pcf-step-connector`, `.pcf-divider`, `.pcf-stat-card`, `.pcf-stat-number`, `.pcf-toolbar`, `.pcf-card-hover`, `.pcf-glow`, `.pcf-gradient-text`, `.pcf-text-balance`, `.pcf-shimmer-bg`, `.pcf-section-label`, `.pcf-accent-dot`, `.pcf-accent-glow`, `.pcf-empty-icon`.
- `ThemeProvider` is now wrapped around children in layout.tsx — no need to wrap again.
- `useKeyboardShortcuts` is invoked from page.tsx with onEscape (clears selection) + onDuplicate (bulk duplicates selected). Ctrl+Z/Y/S/E/D are hardcoded inside the hook and work globally.
- AnimatePresence in page.tsx uses `mode="wait"` + custom direction variants — step transitions are smooth slide+blur.
