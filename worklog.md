# PrintCardFlow — Worklog

## Project Status Assessment (2026-06-18)

### Environment Reality vs. Requested State
The user message describes PrintCardFlow **v1.7** (Electron + Next.js, CI/CD, GitHub Actions, 6-step wizard, etc.) located at `/home/z/my-project` with a `worklog.md` already present.

**Actual environment state:**
- `/home/z/my-project` contains only the **default Next.js 16 scaffold** (package name `nextjs_tailwind_shadcn_ts`, default `page.tsx` with Z.ai logo).
- **No `worklog.md` existed** before this round.
- **No Electron, no `.github/workflows`, no PrintCardFlow source code, no ExcelJS, no JSZip.**
- The package.json is the clean starter stack.

### Attempt to recover the v1.7 codebase from GitHub
- Repo `sobag0404/PrintCardFlow` exists on GitHub (commit `7eb45ef`, branch `main`, ~7.5 MB). It is **public**.
- Multiple download attempts (`git clone`, GitHub API tarball, codeload tarball) **failed or were truncated** due to very slow / unstable network to github.com/codeload.github.com from this sandbox (~50 KB/s, connections dropped mid-stream, gzip EOF errors).
- A resilient background `curl -C - --retry 20` was launched to `/tmp/pcf3.tar.gz`. If it completes, the v1.7 sources can be merged in a later round.

### Decision for this round
Given:
1. The v1.7 codebase is **not present** in the working directory,
2. The sandbox constraints (Next.js only, port 3000, no `bun run build`, no real Electron/.exe/CI execution),
3. Network to GitHub is too unreliable to restore the full repo quickly,

→ **Build PrintCardFlow as a production Next.js 16 web application from scratch**, implementing the core product described in the spec: the 6-step wizard, SKU generator, 6 presets, IP codes, Excel import/export, drag-and-drop preset assignment, keyboard shortcuts, dark/light theme, ZIP export, glassmorphism UI. The Electron/CI/.exe-signing items are documented as out-of-scope for this sandbox and deferred.

### Current goals for this round
- [x] Document real state in `worklog.md`
- [ ] Install missing deps: `exceljs`, `jszip`, `file-saver`, `@dnd-kit/*` (already present)
- [ ] Build domain layer: types, SKU generator, 6 presets, IP codes
- [ ] Build Zustand store + Prisma schema (projects/arts/presets)
- [ ] Build 6-step wizard UI (Start → Folder Select → Scan Results → Preset Assign → Preview → Export)
- [ ] Excel import/export API + ZIP export with progress
- [ ] Drag-and-drop preset assignment + keyboard shortcuts (Alt+→/←, Ctrl+D, Ctrl+/, Ctrl+S, Ctrl+E, Esc)
- [ ] Dark/light theme, glassmorphism, microanimations, sticky footer
- [ ] QA via agent-browser, fix issues
- [ ] Create scheduled `webDevReview` cron (every 15 min)

### Unresolved risks / next-phase priorities
- **GitHub repo recovery**: if the background download finishes, diff against the from-scratch build and port any missing features (electron main process, CI workflow YAML, electron-updater config).
- **Electron + CI**: cannot run in this sandbox; needs a desktop build environment. The web app build here is the functional core that Electron would wrap.
- **WB API integration**: stubs only (needs real API keys).
- **macOS code signing**: needs Apple Developer account.
- **Performance test with 100+ arts**: queued for QA phase.

---

