import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('gitIngest', {
  getState: () => ipcRenderer.invoke('desktop:get-state'),
  chooseFolder: () => ipcRenderer.invoke('desktop:choose-folder'),
  removeRecentProject: (path: string) =>
    ipcRenderer.invoke('desktop:remove-recent-project', { path }),
  preview: (payload: unknown) => ipcRenderer.invoke('desktop:preview', payload),
  generate: (payload: unknown) => ipcRenderer.invoke('desktop:generate', payload),
  cancelGeneration: (requestId: string) =>
    ipcRenderer.invoke('desktop:cancel-generation', { requestId }),
  copyOutput: (output: string) => ipcRenderer.invoke('desktop:copy-output', { output }),
  saveOutput: (payload: { output: string; projectName: string; format: 'markdown' | 'text' }) =>
    ipcRenderer.invoke('desktop:save-output', payload),
  openOutputFile: (filePath: string) =>
    ipcRenderer.invoke('desktop:open-output-file', { filePath }),
  revealOutputFile: (filePath: string) =>
    ipcRenderer.invoke('desktop:reveal-output-file', { filePath }),
  openExternal: (url: string) => ipcRenderer.invoke('desktop:open-external', { url }),
  onGenerationProgress: (callback: (message: unknown) => void) => {
    const listener = (_event: unknown, message: unknown) => callback(message);
    ipcRenderer.on('desktop:generation-progress', listener);
    return () => ipcRenderer.removeListener('desktop:generation-progress', listener);
  },
  onGenerationFinished: (callback: (message: unknown) => void) => {
    const listener = (_event: unknown, message: unknown) => callback(message);
    ipcRenderer.on('desktop:generation-finished', listener);
    return () => ipcRenderer.removeListener('desktop:generation-finished', listener);
  },
});
