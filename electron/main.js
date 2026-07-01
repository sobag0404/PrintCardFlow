// PrintCardFlow — Electron main process
const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const { spawn } = require("child_process");
const http = require("http");
const net = require("net");

const isDev = process.env.NODE_ENV === "development";
const enableAutoUpdater = !isDev && process.env.PRINTCARDFLOW_AUTO_UPDATE === "1";

if (!isDev) {
  app.commandLine.appendSwitch("disable-component-update");
  app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion,HardwareMediaKeyHandling,MediaRouter");
  if (!enableAutoUpdater) app.commandLine.appendSwitch("disable-background-networking");
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
}

// electron-updater (production only, optional)
let autoUpdater = null;
if (enableAutoUpdater) {
  try { autoUpdater = require("electron-updater").autoUpdater; } catch {}
}

let mainWindow = null;
let nextServer = null;
let appUrl = null;

function stopNextServer() {
  if (!nextServer) return;
  const pid = nextServer.pid;
  nextServer = null;
  if (!pid) return;

  if (process.platform === "win32") {
    spawn("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`,
    ], {
      windowsHide: true,
      stdio: "ignore",
    }).on("error", () => {});
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {}
}

function getDbPath() {
  if (isDev) return path.join(process.cwd(), "db", "custom.db");
  return path.join(app.getPath("userData"), "printcardflow.db");
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", (err) => {
        if (Date.now() > deadline) {
          reject(err);
          return;
        }
        setTimeout(probe, 250);
      });
      req.setTimeout(1500, () => req.destroy(new Error("server probe timeout")));
    };
    probe();
  });
}

async function startNextServer() {
  const standaloneCandidates = [
    path.join(process.resourcesPath, ".next", "standalone"),
    path.join(process.resourcesPath, "app", ".next", "standalone"),
    path.join(app.getAppPath(), ".next", "standalone"),
  ];
  const standaloneDir = standaloneCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "server.js")),
  );
  if (!standaloneDir) {
    throw new Error(`No server: ${standaloneCandidates.map((candidate) => path.join(candidate, "server.js")).join(" | ")}`);
  }
  const serverFile = path.join(standaloneDir, "server.js");

  const port = await getFreePort();
  appUrl = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    ELECTRON_RUN_AS_NODE: "1",
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    UV_THREADPOOL_SIZE: "2",
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    DATABASE_URL: `file:${getDbPath()}`,
  };

  await new Promise((resolve, reject) => {
    nextServer = spawn(process.execPath, ["--max-old-space-size=384", "--max-semi-space-size=8", serverFile], { cwd: standaloneDir, env, stdio: ["ignore", "pipe", "pipe"] });
    nextServer.stdout.on("data", (d) => console.log(`[next] ${d.toString().trim()}`));
    nextServer.stderr.on("data", (d) => console.error(`[next] ${d.toString().trim()}`));
    nextServer.on("error", reject);
    nextServer.on("exit", (code, signal) => {
      nextServer = null;
      if (mainWindow) console.error(`[next] exited code=${code} signal=${signal}`);
    });
    waitForServer(appUrl).then(resolve).catch(reject);
  });
}

function isAllowedAppUrl(url) {
  if (isDev) return url.startsWith("http://localhost:3000") || url.startsWith("http://127.0.0.1:3000");
  return !!appUrl && url.startsWith(appUrl);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1024, minHeight: 680,
    show: false, backgroundColor: "#0a0a0a", title: "PrintCardFlow",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: true,
      devTools: isDev,
      spellcheck: false,
      v8CacheOptions: "code",
    },
  });
  mainWindow.once("ready-to-show", () => { mainWindow.show(); if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" }); });
  mainWindow.on("closed", () => { mainWindow = null; });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedAppUrl(url)) event.preventDefault();
  });
  mainWindow.loadURL(isDev ? "http://localhost:3000" : appUrl);
}

function buildMenu() {
  const isMac = process.platform === "darwin";
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(isMac ? [{ label: app.name, submenu: [{ role: "about", label: "О программе" }, { type: "separator" }, { role: "quit", label: "Выйти" }] }] : []),
    { label: "Файл", submenu: [isMac ? { role: "close", label: "Закрыть" } : { role: "quit", label: "Выход" }] },
    { label: "Правка", submenu: [{ role: "undo", label: "Отменить" }, { role: "redo", label: "Повторить" }, { type: "separator" }, { role: "cut", label: "Вырезать" }, { role: "copy", label: "Копировать" }, { role: "paste", label: "Вставить" }, { role: "selectAll", label: "Выбрать все" }] },
    { label: "Вид", submenu: [{ role: "reload", label: "Перезагрузить" }, { role: "forceReload", label: "Принуд. перезагрузка" }, { role: "toggleDevTools", label: "Инструменты разработчика" }, { type: "separator" }, { role: "resetZoom", label: "Сбросить масштаб" }, { role: "zoomIn", label: "Увеличить" }, { role: "zoomOut", label: "Уменьшить" }, { type: "separator" }, { role: "togglefullscreen", label: "Полный экран" }] },
    { label: "Справка", submenu: [{ label: "Открыть GitHub", click: () => shell.openExternal("https://github.com/sobag0404/PrintCardFlow") }, { type: "separator" }, { label: "О программе", click: () => dialog.showMessageBox(mainWindow, { type: "info", title: "О программе", message: "PrintCardFlow", detail: `Версия: ${app.getVersion()}\nSKU генератор для принт-дизайна`, buttons: ["OK"] }) }] },
  ]));
}

// --- IPC: scan real folder ---
const IMAGE_EXT = new Set([".png",".jpg",".jpeg",".webp",".svg",".tif",".tiff",".bmp",".gif",".pdf"]);
ipcMain.handle("scan-folder", async (event, { basePath, count }) => {
  try {
    if (!basePath || !fs.existsSync(basePath)) return { ok: false, error: `Папка не существует: ${basePath}`, arts: [] };
    const entries = await fsp.readdir(basePath, { withFileTypes: true });
    const arts = []; let seq = 0;
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      seq += 1;
      const name = path.basename(entry.name, ext);
      arts.push({ id: `art-${Date.now().toString(36)}-${seq}`, artName: name, presetId: "", ipCode: null, seqOverride: 0, material: "", category: "", sizes: null, computedSkus: [], selected: false, source: path.join(basePath, entry.name), createdAt: Date.now() + seq });
      if (count && arts.length >= count) break;
    }
    return { ok: true, arts, basePath, count: arts.length };
  } catch (err) { return { ok: false, error: err instanceof Error ? err.message : "scan failed", arts: [] }; }
});

ipcMain.handle("pick-folder", async () => {
  if (!mainWindow) return { ok: false, canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"], title: "Выберите папку с артами" });
  if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true };
  return { ok: true, path: result.filePaths[0] };
});

ipcMain.handle("pick-file", async (event, { filters, title }) => {
  if (!mainWindow) return { ok: false, canceled: true };
  const result = await dialog.showOpenDialog(mainWindow, { properties: ["openFile"], title: title || "Выберите файл", filters: filters || [{ name: "Все файлы", extensions: ["*"] }] });
  if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true };
  return { ok: true, path: result.filePaths[0] };
});

ipcMain.handle("save-file", async (event, { defaultName, data, filters }) => {
  if (!mainWindow) return { ok: false, canceled: true };
  const result = await dialog.showSaveDialog(mainWindow, { defaultPath: defaultName, title: "Сохранить файл", filters: filters || [{ name: "Все файлы", extensions: ["*"] }] });
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };
  try { await fsp.writeFile(result.filePath, Buffer.from(data)); return { ok: true, path: result.filePath }; }
  catch (err) { return { ok: false, error: err instanceof Error ? err.message : "save failed" }; }
});

ipcMain.handle("app-info", () => ({ version: app.getVersion(), platform: process.platform, arch: process.arch, isElectron: true, dbPath: getDbPath(), userDataPath: app.getPath("userData") }));

ipcMain.handle("ensure-db", async () => {
  const dbPath = getDbPath(); const dir = path.dirname(dbPath);
  try {
    await fsp.mkdir(dir, { recursive: true });
    if (!fs.existsSync(dbPath)) {
      const bundledDb = path.join(process.resourcesPath, "db", "custom.db");
      if (fs.existsSync(bundledDb)) await fsp.copyFile(bundledDb, dbPath);
    }
    return { ok: true, path: dbPath };
  } catch (err) { return { ok: false, error: err instanceof Error ? err.message : "ensure-db failed" }; }
});

// --- Auto-updater ---
function setupAutoUpdater() {
  if (!autoUpdater) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("update-available", (info) => { if (mainWindow) dialog.showMessageBox(mainWindow, { type: "info", title: "Доступно обновление", message: `Новая версия ${info.version}`, detail: "Скачается в фоне, установится при закрытии.", buttons: ["OK"] }).catch(() => {}); });
  autoUpdater.on("update-downloaded", (info) => { if (mainWindow) dialog.showMessageBox(mainWindow, { type: "info", title: "Обновление готово", message: `Версия ${info.version} скачана`, detail: "Установить сейчас?", buttons: ["Установить", "Позже"], defaultId: 0, cancelId: 1 }).then((r) => { if (r.response === 0) autoUpdater.quitAndInstall(); }).catch(() => {}); });
  autoUpdater.on("error", (err) => console.error("[updater]", err));
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);
}

// --- Lifecycle ---
app.whenReady().then(async () => {
  buildMenu();
  if (!isDev) { try { await startNextServer(); } catch (err) { dialog.showErrorBox("Ошибка запуска", `${err instanceof Error ? err.message : err}`); app.quit(); return; } }
  createWindow();
  if (enableAutoUpdater) setupAutoUpdater();
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { stopNextServer(); if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => { stopNextServer(); });
