import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface RecentProject {
  path: string;
  name: string;
  lastOpenedAt: string;
}

export interface SavedSettings {
  format: 'markdown' | 'text';
  maxFileSizeBytes: number;
  includePatterns: string[];
  excludePatterns: string[];
  advancedOpen: boolean;
}

export interface AppState {
  lastFolderPath: string | null;
  recentProjects: RecentProject[];
  settings: SavedSettings;
}

const DEFAULT_STATE: AppState = {
  lastFolderPath: null,
  recentProjects: [],
  settings: {
    format: 'markdown',
    maxFileSizeBytes: 10 * 1024 * 1024,
    includePatterns: [],
    excludePatterns: [],
    advancedOpen: false,
  },
};

function stateFilePath(userDataPath: string) {
  return path.join(userDataPath, 'git-ingest-state.json');
}

export async function loadAppState(userDataPath: string): Promise<AppState> {
  try {
    const file = await readFile(stateFilePath(userDataPath), 'utf8');
    return { ...DEFAULT_STATE, ...JSON.parse(file) };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveAppState(userDataPath: string, state: AppState) {
  await mkdir(userDataPath, { recursive: true });
  await writeFile(stateFilePath(userDataPath), JSON.stringify(state, null, 2), 'utf8');
}

export async function updateAppState(userDataPath: string, updater: (state: AppState) => AppState) {
  const current = await loadAppState(userDataPath);
  const next = updater(current);
  await saveAppState(userDataPath, next);
  return next;
}

export function rememberRecentProject(state: AppState, projectPath: string) {
  const project = {
    path: projectPath,
    name: path.basename(projectPath),
    lastOpenedAt: new Date().toISOString(),
  };

  return {
    ...state,
    lastFolderPath: projectPath,
    recentProjects: [
      project,
      ...state.recentProjects.filter((entry) => entry.path !== projectPath),
    ].slice(0, 8),
  };
}

export function removeRecentProject(state: AppState, projectPath: string) {
  return {
    ...state,
    lastFolderPath: state.lastFolderPath === projectPath ? null : state.lastFolderPath,
    recentProjects: state.recentProjects.filter((entry) => entry.path !== projectPath),
  };
}
