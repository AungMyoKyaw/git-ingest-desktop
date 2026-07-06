import { describe, expect, it } from 'vitest'

import {
  bytesToMegabytes,
  formatBytes,
  makeRequestKey,
  megabytesToBytes,
  projectNameFromPath,
  toPreviewMetrics
} from './view-model'
import type { PreviewResult } from '../../../env'

const preview: PreviewResult = {
  projectName: 'git-ingest',
  rootDir: '/tmp/git-ingest',
  totalFiles: 5,
  includedFiles: [
    { relativePath: 'README.md', size: 1000, label: 'Markdown', language: 'Markdown' },
    { relativePath: 'src/App.tsx', size: 2000, label: 'TypeScript', language: 'TypeScript' }
  ],
  skippedFiles: [{ relativePath: 'dist/app.js', reason: 'ignored' }],
  ignoredDirectories: [{ path: 'node_modules', reason: 'default ignore' }],
  fileTypes: [{ label: 'TypeScript', count: 1, percentage: 50 }],
  estimatedTokenCount: 12345,
  estimatedOutputBytes: 654321,
  warnings: ['Large output']
}

describe('renderer view-model helpers', () => {
  it('formats bytes compactly', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB')
  })

  it('converts bytes to megabytes for settings hydration', () => {
    expect(bytesToMegabytes(10 * 1024 * 1024)).toBe(10)
  })

  it('converts megabyte input to bytes for preview requests', () => {
    expect(megabytesToBytes('1.5')).toBe(Math.round(1.5 * 1024 * 1024))
    expect(megabytesToBytes('')).toBe(1)
    expect(megabytesToBytes('abc')).toBe(1)
  })

  it('derives project name from POSIX and Windows paths', () => {
    expect(projectNameFromPath('/Users/a/project')).toBe('project')
    expect(projectNameFromPath('C:\\Users\\a\\project')).toBe('project')
    expect(projectNameFromPath('')).toBe('project')
  })

  it('creates stable request keys regardless of pattern order', () => {
    const first = makeRequestKey({
      rootDir: '/tmp/project',
      format: 'markdown',
      maxFileSizeBytes: 1024,
      includePatterns: ['b', 'a'],
      excludePatterns: ['dist', '.git']
    })
    const second = makeRequestKey({
      rootDir: '/tmp/project',
      format: 'markdown',
      maxFileSizeBytes: 1024,
      includePatterns: ['a', 'b'],
      excludePatterns: ['.git', 'dist']
    })

    expect(first).toBe(second)
  })

  it('maps preview metrics for inspector and workspace panels', () => {
    expect(toPreviewMetrics(preview)).toEqual({
      includedFiles: 2,
      skippedFiles: 1,
      estimatedTokens: preview.estimatedTokenCount.toLocaleString(),
      estimatedOutput: '639.0 KB'
    })
  })
})
