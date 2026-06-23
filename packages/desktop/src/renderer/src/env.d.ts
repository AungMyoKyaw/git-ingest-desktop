export interface DesktopError {
  code: string
  userMessage: string
  detail: string | null
}

export interface PreviewResult {
  projectName: string
  rootDir: string
  totalFiles: number
  includedFiles: Array<{ relativePath: string; size: number; label: string; language: string }>
  skippedFiles: Array<{ relativePath: string; reason: string }>
  ignoredDirectories: Array<{ path: string; reason: string }>
  fileTypes: Array<{ label: string; count: number; percentage: number }>
  estimatedOutputBytes: number
  warnings: string[]
}

export interface GenerateResult extends PreviewResult {
  format: 'markdown' | 'text'
  output: string
  outputBytes: number
  tokenEstimate: number
}

export interface GenerationProgressMessage {
  requestId: string
  phase: string
  processedFiles?: number
  totalFiles?: number
}

export type GenerationFinishedMessage =
  | { requestId: string; status: 'success'; result: GenerateResult }
  | { requestId: string; status: 'cancelled'; error: DesktopError }
  | { requestId: string; status: 'error'; error: DesktopError }

export interface AppState {
  lastFolderPath: string | null
  recentProjects: Array<{ path: string; name: string; lastOpenedAt: string }>
  settings: {
    format: 'markdown' | 'text'
    maxFileSizeBytes: number
    includePatterns: string[]
    excludePatterns: string[]
    advancedOpen: boolean
  }
}

declare global {
  interface Window {
    gitIngest: {
      getState: () => Promise<AppState>
      chooseFolder: () => Promise<{ canceled: boolean; folderPath?: string }>
      preview: (payload: unknown) => Promise<{ ok: true; result: PreviewResult } | { ok: false; error: DesktopError }>
      generate: (payload: unknown) => Promise<{ ok: true; requestId: string } | { ok: false; error: DesktopError }>
      cancelGeneration: (requestId: string) => Promise<{ ok: boolean; error?: DesktopError }>
      copyOutput: (output: string) => Promise<{ ok: boolean; error?: DesktopError }>
      saveOutput: (payload: { output: string; projectName: string; format: 'markdown' | 'text' }) => Promise<{ ok: boolean; canceled?: boolean; filePath?: string; error?: DesktopError }>
      openOutputFile: (filePath: string) => Promise<{ ok: boolean; error?: DesktopError }>
      revealOutputFile: (filePath: string) => Promise<{ ok: boolean; error?: DesktopError }>
      openExternal: (url: string) => Promise<{ ok: boolean }>
      onGenerationProgress: (callback: (message: GenerationProgressMessage) => void) => () => void
      onGenerationFinished: (callback: (message: GenerationFinishedMessage) => void) => () => void
    }
  }
}
