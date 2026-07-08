import path from 'node:path';

export function resolvePreloadEntryPath(currentDir: string) {
  return path.join(currentDir, '../preload/index.mjs');
}

export function createBrowserWindowWebPreferences(currentDir: string) {
  return {
    preload: resolvePreloadEntryPath(currentDir),
    contextIsolation: true,
    sandbox: false,
    nodeIntegration: false,
    webSecurity: true,
  };
}
