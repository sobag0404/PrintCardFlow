# PrintCardFlow — промпт для AI-ассистента

Скопируй всё содержимое ниже (начиная с "Ты — разработчик...") и вставь в Codex / Cursor / Claude / любой AI-ассистент.

---

Ты — опытный fullstack-разработчик. Продолжи разработку проекта **PrintCardFlow**. Вот полный контекст:

## 🔑 Доступы
- **GitHub репозиторий**: https://github.com/sobag0404/PrintCardFlow
- **GitHub Username**: `sobag0404`
- **GitHub Token**: `ВСТАВЬ_СЮДА_ТОЙЕН_ИЗ_СООБЩЕНИЯ_ВЫШЕ` (ghp_...)
- **Локальный проект**: `/home/z/my-project`
- **Dev-сервер**: `bun run dev` (порт 3000, автозапуск)
- **Worklog**: `/home/z/my-project/worklog.md` — ЧИТАТЬ В ПЕРВУЮ ОЧЕРЕДЬ
- **Последний релиз .exe**: https://github.com/sobag0404/PrintCardFlow/releases/tag/v2.0.5

## 🛠 Стек
Next.js 16 (App Router), TypeScript 5, React 19, Tailwind CSS 4, shadcn/ui (New York), Lucide icons, Framer Motion, Zustand (persisted), Prisma ORM (SQLite), ExcelJS, JSZip, Zod, @dnd-kit, @tanstack/react-virtual, Electron 33, electron-builder 25, electron-updater 6, GitHub Actions CI.

## 📊 Текущий статус (v2.0.5)
Полностью рабочий 6-шаговый визард: Start → Folder → Scan → Preset → Preview → Export.

**Что работает:**
- SKU генерация: `{ArtName}_{SeqNum}_{Size}_{Material}_{Category}_{IP}`
- 6 встроенных пресетов + 5 кураторских бандлов (17 пресетов) в галерее
- IP-коды (БТ/МА/МВ/МЛ/ЗА/ЗН)
- Excel чтение/запись, 5 форматов экспорта (Excel/ZIP/CSV/JSON/TXT)
- Undo/Redo (Ctrl+Z/Y, 50-entry history)
- Drag-and-drop, клавиатурные шорткаты
- Prisma persistence: ExportHistory + Sessions (save/load проектов)
- Preferences store + Settings dialog
- Search-and-replace, recently-used presets, bulk actions
- Virtualized preview table, SKU validation, validation banner
- Тёмная/светлая тема, glassmorphism, адаптивный дизайн
- Electron обёртка: реальное сканирование папок через IPC, нативный диалог
- GitHub Actions CI: автосборка .exe на Windows (npmRebuild=false)
- Автообновление из GitHub Releases (electron-updater)
- Иконки приложения сгенерированы (icon.ico + icon.png)

**Что НЕ готово:**
1. Реальная интеграция WB API — заглушки (нужны ключи)
2. Код-подпись для Windows (SmartScreen блокирует .exe)
3. macOS сборка — отключена
4. Производительность 500+ артов на preset step (не виртуализирован)

## 🎯 Приоритеты

**P0 (критично):**
1. Тест установленного .exe на реальном Windows
2. Исправить баги найденные при тестировании

**P1 (важно):**
3. Виртуализация preset-step art table для 500+ артов
4. CSV импорт (сейчас только Excel импорт)
5. "Очистить все арты" action с подтверждением
6. Project stats dashboard на start screen
7. UI улучшения

**P2:**
8. WB API интеграция
9. Код-подпись (OV сертификат)
10. Мультиязычность (RU/EN)

## 🔧 Команды
```bash
bun run dev                 # Web dev (порт 3000)
bun run dev:electron        # Electron + Next.js dev
bun run build:next          # Next.js standalone build
bun run build:electron:win  # Windows .exe
bun run lint                # ESLint
bun run db:push             # Prisma schema → DB
bun run db:generate         # Prisma client

# Git / Release
git add . && git commit -m "..." && git push origin main
git tag v2.1.0 && git push origin v2.1.0  # Триггерит CI сборку .exe
```

## 📐 Архитектура

### Доменный слой (`src/lib/domain/`)
- `types.ts` — Art, Preset, GeneratedSku, IpCode, SizeEntry, WizardStep, STEP_ORDER, STEP_LABELS
- `presets.ts` — BUILTIN_PRESETS (6)
- `ip-codes.ts` — IP_CODES (БТ/МА/МВ/МЛ/ЗА/ЗН)
- `sku-generator.ts` — generateSkus, recomputeArtSkus, buildSku, skuStats
- `demo-data.ts` — scanFolderDemo, DEMO_BASE_PATHS
- `validation.ts` — validateProject, detectDuplicateSkus
- `template-gallery.ts` — GALLERY_BUNDLES (5 бандлов, 17 пресетов)

### Сторы (`src/lib/store/`)
- `wizard-store.ts` — Zustand persisted. State: step, project, arts, presets, past/future (undo/redo), recentPresetIds, toasts, helpOpen, exportProgress. Actions: navigation, arts CRUD, bulk actions (duplicateArtsBulk, clearAllPresets, resetAllIpCodes, invertSelection, searchReplaceArts), presets CRUD, undo/redo (`_commit` helper с 50-entry cap), pushRecentPreset, toasts.
- `preferences-store.ts` — Zustand persisted. defaultExportFormat, filenameTemplate, autoLogExports, showExportToast, defaultIncludeManifest, themePreference. Export: `getPreferences()`.

### Export libs (`src/lib/export/`, `src/lib/excel/`, `src/lib/zip/`)
- `text-exporters.ts` — buildCsv, buildJson, buildTxtSummary (isomorphic, no Node APIs)
- `filename-template.ts` — renderFilenameTemplate ({project}/{date}/{time}/{count})
- `exceljs-lib.ts` — parseExcelBuffer (RU+EN aliases), buildExcelBuffer
- `zip-builder.ts` — buildZipArchive (xlsx+csv+manifest+summary+readme)

### Electron (`electron/`, `src/lib/electron/`)
- `main.js` — BrowserWindow, Russian menu, IPC (scan-folder через реальный fs.readdir, pick-folder, pick-file, save-file, read-file, app-info, ensure-db), Next.js standalone server spawn, auto-updater
- `preload.js` — contextBridge: `window.electronAPI`
- `electron-client.ts` — isElectron(), scanFolder (Electron→IPC / web→demo), pickFolder

### API routes (`src/app/api/`)
scan-folder, excel-import, excel-export, zip-export, csv-export, json-export, txt-export, export-history (GET/POST/DELETE/redownload), sessions (GET/POST/PATCH/DELETE)

### UI компоненты (`src/components/`)
- `shared/` — AppHeader, AppFooter, StepProgress, ToastStack (hover pause), HelpDialog, UndoRedoControls, ValidationBanner, ShortcutCheatsheet, SettingsDialog, LoadingButton, EmptyState, Skeletons, AnimatedNumber, SearchReplaceDialog, ProjectManager, ExportHistoryPanel, ThemeProvider, ThemeToggle
- `wizard/` — StepStart, StepFolder (Electron-aware), StepScan, StepPreset (dnd-kit + bulk actions), StepPreview (@tanstack/react-virtual), StepExport (5 форматов + history), export-handlers.ts
- `preset/` — PresetChip, PresetPalette, PresetEditor, PresetGallery, preset-template-io.ts (Zod), RecentPresetsBar
- `art/` — ArtTable, ArtRow (dnd-kit sortable), SkuBadge, IpCodeBadge
- `ui/` — полный shadcn/ui

### Страницы
- `src/app/page.tsx` — direction-aware AnimatePresence step transitions + useKeyboardShortcuts
- `src/app/layout.tsx` — ThemeProvider, Geist (cyrillic), Toaster + SonnerToaster
- `src/app/globals.css` — `.glass`, `.pcf-aurora`, `.pcf-mono`, `.pcf-focus`, `.scroll-pcf`, `.pcf-accent-{amber,rose,pink,fuchsia,emerald,violet}`, `.pcf-stat-card`, `.pcf-toolbar`, `.pcf-card-hover`, `.pcf-shimmer-bg`, `.pcf-section-label`, `.pcf-accent-glow`, `.pcf-accent-dot`, `.pcf-empty-icon`, 6 keyframes, `prefers-reduced-motion`

### Prisma schema (`prisma/schema.prisma`)
Project, Art, Preset, ExportHistory (200-cap), Session (upsert by name)

### CI (`.github/workflows/build.yml`)
windows-latest → Node 20 + Bun → install --ignore-scripts → db:generate → db:push → build:next → electron-builder --win --x64 (npmRebuild=false) → upload artifact → release on tags

## 🔍 Инструкции

1. **Читай `worklog.md` первым** — актуальный статус и история
2. **Не используй `bun run build`** в sandbox — только `bun run lint`
3. **Electron-сборка только через GitHub Actions** — нельзя локально в sandbox
4. **При коммитах** → push на main триггерит CI сборку .exe
5. **При баг-фиксах** → новый тег (v2.0.6, v2.0.7...) → push тега → CI соберёт .exe
6. **Проверяй lint**: `bun run lint` (0 errors, 1 warning от useVirtualizer — нормально)
7. **Не ломай**: undo/redo, export handlers, Prisma persistence, Electron IPC
8. **UI на русском**, accent палитра (NO indigo/blue), emerald/teal для primary
9. **Обновляй worklog.md** при изменениях
10. **package.json version = 2.0.0**, последний тег v2.0.5 — синхронизируй при релизе

## 🚨 Известные проблемы
1. **SmartScreen блокирует .exe** — нет код-подписи. Fix: Свойства → Разблокировать, или отключить SmartScreen, или "Любой источник" в настройках приложений Win11
2. **CSV/JSON/TXT export** — client-side (isomorphic), не через API (API routes были flaky)
3. **Preset step не виртуализирован** — 200 arts OK, 500+ медленно
4. **setPresets non-undoable** — gallery import нельзя отменить
5. **GitHub Actions**: `npmRebuild: false` обязателен (без него @parcel/watcher не компилируется без Visual Studio C++)

## 📝 Что делать сейчас

Оцени текущий статус проекта по worklog.md, выпол必要的 QA (если есть доступ к агент-браузеру), и продолжи разработку по приоритетам выше. Если найдёшь баги — исправь. Если всё стабильно — добавляй новые фичи. Обязательно улучшай UI детали и добавляй больше функциональности. После работы обнови worklog.md.
