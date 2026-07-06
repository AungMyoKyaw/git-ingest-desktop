import type { PreviewResult } from '../../../env'

export function bytesToMegabytes(value: number): number {
  return Number((value / (1024 * 1024)).toFixed(1))
}

export function megabytesToBytes(value: string): number {
  const megabytes = Number(value || '0')
  if (!Number.isFinite(megabytes)) return 1
  return Math.max(1, Math.round(megabytes * 1024 * 1024))
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function projectNameFromPath(folderPath: string): string {
  return folderPath.split(/[\\/]/).filter(Boolean).at(-1) ?? 'project'
}

export function makeRequestKey(payload: {
  rootDir: string
  format: 'markdown' | 'text'
  maxFileSizeBytes: number
  includePatterns: string[]
  excludePatterns: string[]
}): string {
  return JSON.stringify({
    ...payload,
    includePatterns: [...payload.includePatterns].sort(),
    excludePatterns: [...payload.excludePatterns].sort()
  })
}

export function toPreviewMetrics(preview: PreviewResult | null): {
  includedFiles: number
  skippedFiles: number
  estimatedTokens: string
  estimatedOutput: string
} {
  if (!preview) {
    return {
      includedFiles: 0,
      skippedFiles: 0,
      estimatedTokens: '0',
      estimatedOutput: '0 B'
    }
  }

  return {
    includedFiles: preview.includedFiles.length,
    skippedFiles: preview.skippedFiles.length,
    estimatedTokens: preview.estimatedTokenCount.toLocaleString(),
    estimatedOutput: formatBytes(preview.estimatedOutputBytes)
  }
}
