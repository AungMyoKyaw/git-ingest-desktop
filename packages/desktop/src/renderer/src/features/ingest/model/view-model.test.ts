import { describe, expect, it } from 'vitest';

import {
  bytesToMegabytes,
  deriveAppStatus,
  formatBytes,
  getPrimaryActionState,
  getStatusBarText,
  getWorkflowSteps,
  makeRequestKey,
  megabytesToBytes,
  normalizePatternAddition,
  projectNameFromPath,
  toPreviewMetrics,
} from './view-model';
import type { PreviewResult } from '../../../env';

const preview: PreviewResult = {
  projectName: 'git-ingest',
  rootDir: '/tmp/git-ingest',
  totalFiles: 5,
  includedFiles: [
    { relativePath: 'README.md', size: 1000, label: 'Markdown', language: 'Markdown' },
    { relativePath: 'src/App.tsx', size: 2000, label: 'TypeScript', language: 'TypeScript' },
  ],
  skippedFiles: [{ relativePath: 'dist/app.js', reason: 'ignored' }],
  ignoredDirectories: [{ path: 'node_modules', reason: 'default ignore' }],
  fileTypes: [{ label: 'TypeScript', count: 1, percentage: 50 }],
  estimatedTokenCount: 12345,
  estimatedOutputBytes: 654321,
  warnings: ['Large output'],
};

describe('renderer view-model helpers', () => {
  it('formats bytes compactly', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
  });

  it('converts bytes to megabytes for settings hydration', () => {
    expect(bytesToMegabytes(10 * 1024 * 1024)).toBe(10);
  });

  it('converts megabyte input to bytes for preview requests', () => {
    expect(megabytesToBytes('1.5')).toBe(Math.round(1.5 * 1024 * 1024));
    expect(megabytesToBytes('')).toBe(1);
    expect(megabytesToBytes('abc')).toBe(1);
  });

  it('derives project name from POSIX and Windows paths', () => {
    expect(projectNameFromPath('/Users/a/project')).toBe('project');
    expect(projectNameFromPath('C:\\Users\\a\\project')).toBe('project');
    expect(projectNameFromPath('')).toBe('project');
  });

  it('creates stable request keys regardless of pattern order', () => {
    const first = makeRequestKey({
      rootDir: '/tmp/project',
      format: 'markdown',
      maxFileSizeBytes: 1024,
      includePatterns: ['b', 'a'],
      excludePatterns: ['dist', '.git'],
    });
    const second = makeRequestKey({
      rootDir: '/tmp/project',
      format: 'markdown',
      maxFileSizeBytes: 1024,
      includePatterns: ['a', 'b'],
      excludePatterns: ['.git', 'dist'],
    });

    expect(first).toBe(second);
  });

  it('maps preview metrics for inspector and workspace panels', () => {
    expect(toPreviewMetrics(preview)).toEqual({
      includedFiles: 2,
      skippedFiles: 1,
      estimatedTokens: preview.estimatedTokenCount.toLocaleString(),
      estimatedOutput: '639.0 KB',
    });
  });

  it('marks workflow steps from project selection through export without a rules step', () => {
    expect(
      getWorkflowSteps({ hasProject: true, hasPreview: true, canGenerate: true, hasOutput: false }),
    ).toEqual([
      { label: 'Project', status: 'complete' },
      { label: 'Preview', status: 'complete' },
      { label: 'Generate', status: 'current' },
      { label: 'Export', status: 'pending' },
    ]);

    expect(
      getWorkflowSteps({ hasProject: true, hasPreview: true, canGenerate: false, hasOutput: true }),
    ).toEqual([
      { label: 'Project', status: 'complete' },
      { label: 'Preview', status: 'complete' },
      { label: 'Generate', status: 'complete' },
      { label: 'Export', status: 'current' },
    ]);
  });

  it('derives one normalized app status for visual state', () => {
    expect(
      deriveAppStatus({
        busy: false,
        error: null,
        generated: null,
        hasProject: false,
        phase: '',
        preview: null,
      }),
    ).toBe('empty');
    expect(
      deriveAppStatus({
        busy: false,
        error: null,
        generated: null,
        hasProject: true,
        phase: '',
        preview: null,
      }),
    ).toBe('previewing');
    expect(
      deriveAppStatus({
        busy: true,
        error: null,
        generated: null,
        hasProject: true,
        phase: 'Scanning preview',
        preview: null,
      }),
    ).toBe('previewing');
    expect(
      deriveAppStatus({
        busy: false,
        error: null,
        generated: null,
        hasProject: true,
        phase: '',
        preview,
      }),
    ).toBe('ready');
    expect(
      deriveAppStatus({
        busy: true,
        error: null,
        generated: null,
        hasProject: true,
        phase: 'Generating output',
        preview,
      }),
    ).toBe('generating');
    expect(
      deriveAppStatus({
        busy: false,
        error: null,
        generated: {
          ...preview,
          format: 'markdown',
          output: 'content',
          outputBytes: 7,
          tokenEstimate: 4,
        },
        hasProject: true,
        phase: 'done',
        preview,
      }),
    ).toBe('generated');
    expect(
      deriveAppStatus({
        busy: false,
        error: { code: 'E_PREVIEW', userMessage: 'Preview failed', detail: 'stack' },
        generated: null,
        hasProject: true,
        phase: '',
        preview,
      }),
    ).toBe('error');
  });

  it('derives chrome primary action from app state', () => {
    expect(
      getPrimaryActionState({
        appStatus: 'empty',
        canGenerate: false,
        hasOutput: false,
      }),
    ).toEqual({ kind: 'choose-folder', label: 'Choose Folder', disabled: false });
    expect(
      getPrimaryActionState({
        appStatus: 'ready',
        canGenerate: true,
        hasOutput: false,
      }),
    ).toEqual({ kind: 'generate', label: 'Generate', disabled: false });
    expect(
      getPrimaryActionState({
        appStatus: 'generating',
        canGenerate: false,
        hasOutput: false,
      }),
    ).toEqual({ kind: 'cancel', label: 'Cancel', disabled: false });
    expect(
      getPrimaryActionState({
        appStatus: 'generated',
        canGenerate: false,
        hasOutput: true,
      }),
    ).toEqual({ kind: 'copy', label: 'Copy', disabled: false });
  });

  it('normalizes pattern additions by trimming and rejecting duplicates', () => {
    expect(normalizePatternAddition(' src/**/*.ts ', ['README.md'])).toEqual({
      patterns: ['README.md', 'src/**/*.ts'],
      accepted: true,
      message: '',
    });
    expect(normalizePatternAddition('src/**/*.ts', ['src/**/*.ts'])).toEqual({
      patterns: ['src/**/*.ts'],
      accepted: false,
      message: 'Pattern already exists.',
    });
    expect(normalizePatternAddition('   ', [])).toEqual({
      patterns: [],
      accepted: false,
      message: '',
    });
  });

  it('formats status bar text without fixed column assumptions', () => {
    expect(
      getStatusBarText({ appStatus: 'empty', folderPath: '', preview: null, generated: null }),
    ).toEqual({
      left: 'No folder selected',
      right: 'No preview',
    });
    expect(
      getStatusBarText({
        appStatus: 'ready',
        folderPath: '/tmp/git-ingest',
        preview,
        generated: null,
      }),
    ).toEqual({
      left: 'Ready · /tmp/git-ingest',
      right: '2 files · 12,345 tokens · 639.0 KB',
    });
  });
});
