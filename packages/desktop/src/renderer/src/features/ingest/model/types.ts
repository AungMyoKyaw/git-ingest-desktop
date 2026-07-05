import type { DesktopError, GenerateResult, PreviewResult } from '../../../env'

export type AppView = 'projects' | 'runs' | 'settings'

export type RunRecord = {
  id: string
  projectName: string
  createdAt: string
  tokenCount: number
  outputBytes: number
  status: 'success' | 'cancelled' | 'error'
}

export type RulesDraft = {
  format: 'markdown' | 'text'
  maxFileSizeMb: string
  includeInput: string
  excludeInput: string
  includePatterns: string[]
  excludePatterns: string[]
}

export type FeedbackState = {
  message: string
  error: DesktopError | null
}

export type IngestSnapshot = {
  folderPath: string
  preview: PreviewResult | null
  generated: GenerateResult | null
  savedFilePath: string | null
  phase: string
  busy: boolean
  activeRequestId: string | null
}
