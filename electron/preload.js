// PrintCardFlow — Electron preload
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  scanFolder: (basePath, count) => ipcRenderer.invoke("scan-folder", { basePath, count }),
  pickFolder: () => ipcRenderer.invoke("pick-folder"),
  pickFile: (filters, title) => ipcRenderer.invoke("pick-file", { filters, title }),
  saveFile: (defaultName, data, filters) => ipcRenderer.invoke("save-file", { defaultName, data, filters }),
  readFile: (filePath) => ipcRenderer.invoke("read-file", { path: filePath }),
  appInfo: () => ipcRenderer.invoke("app-info"),
  ensureDb: () => ipcRenderer.invoke("ensure-db"),
});
