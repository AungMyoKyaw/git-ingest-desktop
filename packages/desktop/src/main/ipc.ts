import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  clipboard,
  dialog,
  ipcMain,
  shell,
  type BrowserWindow,
  type IpcMainInvokeEvent,
} from 'electron';

import { previewProject, toGitIngestError } from '@git-ingest/core';

import { validateExistingFilePath } from './file-actions.js';
import { createGenerationManager } from './generation.js';
import {
  loadAppState,
  rememberRecentProject,
  removeRecentProject,
  updateAppState,
} from './state.js';
import {
  validateExternalUrl,
  validateGeneratePayload,
  validatePreviewPayload,
} from './validators.js';

interface RegisterIpcHandlersOptions {
  window: BrowserWindow;
  userDataPath: string;
  isTrustedSender: (url: string) => boolean;
}

function ensureTrustedSender(event: IpcMainInvokeEvent, isTrustedSender: (url: string) => boolean) {
  if (!isTrustedSender(event.senderFrame.url)) {
    throw new Error('Untrusted IPC sender');
  }
}

function toControlledError(error: unknown) {
  const normalized = toGitIngestError(error);
  return {
    code: normalized.code,
    userMessage: normalized.userMessage,
    detail: normalized.detail ?? null,
  };
}

export function registerIpcHandlers(options: RegisterIpcHandlersOptions) {
  const { window, userDataPath, isTrustedSender } = options;
  const generation = createGenerationManager({
    onProgress: (message) => {
      window.webContents.send('desktop:generation-progress', message);
    },
    onFinished: async (message) => {
      if (message.status === 'success') {
        await updateAppState(userDataPath, (state) =>
          rememberRecentProject(state, message.result.rootDir),
        );
        await updateAppState(userDataPath, (state) => ({
          ...state,
          settings: {
            ...state.settings,
            format: message.result.format,
            maxFileSizeBytes: state.settings.maxFileSizeBytes,
            includePatterns: state.settings.includePatterns,
            excludePatterns: state.settings.excludePatterns,
          },
        }));
      }

      window.webContents.send('desktop:generation-finished', message);
    },
  });

  ipcMain.handle('desktop:get-state', async (event) => {
    ensureTrustedSender(event, isTrustedSender);
    return loadAppState(userDataPath);
  });

  ipcMain.handle('desktop:remove-recent-project', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);

    if (typeof payload?.path !== 'string' || payload.path.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          userMessage: 'Choose a recent project to remove.',
          detail: null,
        },
      };
    }

    const state = await updateAppState(userDataPath, (current) =>
      removeRecentProject(current, payload.path),
    );
    return { ok: true, recentProjects: state.recentProjects };
  });

  ipcMain.handle('desktop:choose-folder', async (event) => {
    ensureTrustedSender(event, isTrustedSender);
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    const folderPath = result.filePaths[0];
    await updateAppState(userDataPath, (state) => rememberRecentProject(state, folderPath));
    return { canceled: false, folderPath };
  });

  ipcMain.handle('desktop:preview', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);
    try {
      const request = validatePreviewPayload(payload);
      const result = await previewProject(request);
      await updateAppState(userDataPath, (state) => rememberRecentProject(state, request.rootDir));
      return { ok: true, result };
    } catch (error) {
      return { ok: false, error: toControlledError(error) };
    }
  });

  ipcMain.handle('desktop:generate', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);
    try {
      const request = validateGeneratePayload(payload);
      await updateAppState(userDataPath, (state) => ({
        ...state,
        settings: {
          ...state.settings,
          format: request.format,
          maxFileSizeBytes: request.maxFileSizeBytes ?? state.settings.maxFileSizeBytes,
          includePatterns: request.includePatterns ?? [],
          excludePatterns: request.excludePatterns ?? [],
          advancedOpen: state.settings.advancedOpen,
        },
      }));
      const requestId = await generation.start(request);
      return { ok: true, requestId };
    } catch (error) {
      return { ok: false, error: toControlledError(error) };
    }
  });

  ipcMain.handle('desktop:cancel-generation', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);
    if (typeof payload?.requestId !== 'string' || payload.requestId.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          userMessage: 'There is no active generation to cancel.',
          detail: null,
        },
      };
    }

    return { ok: generation.cancel(payload.requestId) };
  });

  ipcMain.handle('desktop:copy-output', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);
    if (typeof payload?.output !== 'string' || payload.output.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_OUTPUT',
          userMessage: 'Generate output before copying it.',
          detail: null,
        },
      };
    }

    clipboard.writeText(payload.output);
    return { ok: true };
  });

  ipcMain.handle('desktop:save-output', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);

    if (typeof payload?.output !== 'string' || payload.output.length === 0) {
      return {
        ok: false,
        error: {
          code: 'INVALID_OUTPUT',
          userMessage: 'Generate output before saving it.',
          detail: null,
        },
      };
    }

    const format = payload?.format === 'text' ? 'text' : 'markdown';
    const projectName =
      typeof payload?.projectName === 'string' && payload.projectName.trim()
        ? payload.projectName
        : 'git-ingest';
    const result = await dialog.showSaveDialog(window, {
      defaultPath: `${projectName}.${format === 'text' ? 'txt' : 'md'}`,
    });

    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true };
    }

    await writeFile(result.filePath, payload.output, 'utf8');
    return { ok: true, filePath: result.filePath };
  });

  ipcMain.handle('desktop:open-external', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);
    const url = validateExternalUrl(payload?.url);
    await shell.openExternal(url);
    return { ok: true };
  });

  ipcMain.handle('desktop:open-output-file', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);

    try {
      const filePath = await validateExistingFilePath(payload?.filePath);
      const error = await shell.openPath(filePath);
      if (error) {
        return {
          ok: false,
          error: {
            code: 'OPEN_FAILED',
            userMessage: 'The file could not be opened.',
            detail: error,
          },
        };
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: toControlledError(error) };
    }
  });

  ipcMain.handle('desktop:reveal-output-file', async (event, payload) => {
    ensureTrustedSender(event, isTrustedSender);

    try {
      const filePath = await validateExistingFilePath(payload?.filePath);
      shell.showItemInFolder(filePath);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: toControlledError(error) };
    }
  });
}
