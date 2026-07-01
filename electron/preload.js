// PrintCardFlow — Electron preload
const { contextBridge, ipcRenderer } = require("electron");
const performanceMode = process.env.NODE_ENV === "development" ? "balanced" : "low-power";

window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.performanceMode = performanceMode;
});

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  performanceMode,
  scanFolder: (basePath, count) => ipcRenderer.invoke("scan-folder", { basePath, count }),
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  pickFile: (filters, title) => ipcRenderer.invoke("pick-file", { filters, title }),
  saveFile: (defaultName, data, filters) => ipcRenderer.invoke("save-file", { defaultName, data, filters }),
  appInfo: () => ipcRenderer.invoke("app-info"),
  ensureDb: () => ipcRenderer.invoke("ensure-db"),
});
