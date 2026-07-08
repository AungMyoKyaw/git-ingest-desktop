import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { app, BrowserWindow } from 'electron';

import { registerIpcHandlers } from './ipc.js';
import { createBrowserWindowWebPreferences } from './paths.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const appIconPath = path.join(currentDir, '../../build/icons/icon.png');

function isTrustedAppUrl(url: string) {
  if (url.startsWith('file://')) {
    return true;
  }

  return Boolean(
    process.env.ELECTRON_RENDERER_URL && url.startsWith(process.env.ELECTRON_RENDERER_URL),
  );
}

function createMainWindow() {
  const window = new BrowserWindow({
    title: 'Git-Ingest',
    width: 1280,
    height: 860,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    backgroundColor: '#fbfcfe',
    icon: appIconPath,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 17 } : undefined,
    webPreferences: createBrowserWindowWebPreferences(currentDir),
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (!isTrustedAppUrl(url)) {
      event.preventDefault();
    }
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  window.once('ready-to-show', () => {
    window.show();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(path.join(currentDir, '../renderer/index.html'));
  }

  return window;
}

app.whenReady().then(() => {
  const window = createMainWindow();

  registerIpcHandlers({
    window,
    userDataPath: app.getPath('userData'),
    isTrustedSender: isTrustedAppUrl,
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
