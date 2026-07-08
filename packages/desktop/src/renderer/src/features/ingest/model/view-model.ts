import type { DesktopError, GenerateResult, PreviewResult } from '../../../env';
import type { AppStatus } from './types';

export function bytesToMegabytes(value: number): number {
  return Number((value / (1024 * 1024)).toFixed(1));
}

export function megabytesToBytes(value: string): number {
  const megabytes = Number(value || '0');
  if (!Number.isFinite(megabytes)) return 1;
  return Math.max(1, Math.round(megabytes * 1024 * 1024));
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function projectNameFromPath(folderPath: string): string {
  return folderPath.split(/[\\/]/).filter(Boolean).at(-1) ?? 'project';
}

export function makeRequestKey(payload: {
  rootDir: string;
  format: 'markdown' | 'text';
  maxFileSizeBytes: number;
  includePatterns: string[];
  excludePatterns: string[];
}): string {
  return JSON.stringify({
    ...payload,
    includePatterns: [...payload.includePatterns].sort(),
    excludePatterns: [...payload.excludePatterns].sort(),
  });
}

export function toPreviewMetrics(preview: PreviewResult | null): {
  includedFiles: number;
  skippedFiles: number;
  estimatedTokens: string;
  estimatedOutput: string;
} {
  if (!preview) {
    return {
      includedFiles: 0,
      skippedFiles: 0,
      estimatedTokens: '0',
      estimatedOutput: '0 B',
    };
  }

  return {
    includedFiles: preview.includedFiles.length,
    skippedFiles: preview.skippedFiles.length,
    estimatedTokens: preview.estimatedTokenCount.toLocaleString(),
    estimatedOutput: formatBytes(preview.estimatedOutputBytes),
  };
}

export type WorkflowStepStatus = 'complete' | 'current' | 'pending';

export type WorkflowStep = {
  label: 'Project' | 'Preview' | 'Generate' | 'Export';
  status: WorkflowStepStatus;
};

export function getWorkflowSteps({
  hasProject,
  hasPreview,
  canGenerate,
  hasOutput,
}: {
  hasProject: boolean;
  hasPreview: boolean;
  canGenerate: boolean;
  hasOutput: boolean;
}): WorkflowStep[] {
  return [
    { label: 'Project', status: hasProject ? 'complete' : 'current' },
    { label: 'Preview', status: hasPreview ? 'complete' : hasProject ? 'current' : 'pending' },
    {
      label: 'Generate',
      status: hasOutput ? 'complete' : canGenerate ? 'current' : hasPreview ? 'current' : 'pending',
    },
    { label: 'Export', status: hasOutput ? 'current' : 'pending' },
  ];
}

export function deriveAppStatus({
  busy,
  error,
  generated,
  hasProject,
  phase,
  preview,
}: {
  busy: boolean;
  error: DesktopError | null;
  generated: GenerateResult | null;
  hasProject: boolean;
  phase: string;
  preview: PreviewResult | null;
}): AppStatus {
  if (error) return 'error';
  if (busy && /generat/i.test(phase)) return 'generating';
  if (busy) return 'previewing';
  if (generated?.output) return 'generated';
  if (preview) return 'ready';
  if (hasProject) return 'previewing';
  return 'empty';
}

export type PrimaryActionKind = 'choose-folder' | 'generate' | 'cancel' | 'copy';

export function getPrimaryActionState({
  appStatus,
  canGenerate,
  hasOutput,
}: {
  appStatus: AppStatus;
  canGenerate: boolean;
  hasOutput: boolean;
}): { kind: PrimaryActionKind; label: string; disabled: boolean } {
  if (appStatus === 'generating') {
    return { kind: 'cancel', label: 'Cancel', disabled: false };
  }

  if (hasOutput) {
    return { kind: 'copy', label: 'Copy', disabled: false };
  }

  if (appStatus === 'empty') {
    return { kind: 'choose-folder', label: 'Choose Folder', disabled: false };
  }

  return { kind: 'generate', label: 'Generate', disabled: !canGenerate };
}

export function normalizePatternAddition(
  input: string,
  patterns: string[],
): { patterns: string[]; accepted: boolean; message: string } {
  const value = input.trim();

  if (!value) {
    return { patterns, accepted: false, message: '' };
  }

  if (patterns.includes(value)) {
    return { patterns, accepted: false, message: 'Pattern already exists.' };
  }

  return { patterns: [...patterns, value], accepted: true, message: '' };
}

export function getStatusBarText({
  appStatus,
  folderPath,
  preview,
  generated,
}: {
  appStatus: AppStatus;
  folderPath: string;
  preview: PreviewResult | null;
  generated: GenerateResult | null;
}): { left: string; right: string } {
  const statusLabel: Record<AppStatus, string> = {
    empty: 'No folder selected',
    previewing: 'Previewing',
    ready: 'Ready',
    generating: 'Generating',
    generated: 'Generated',
    error: 'Error',
  };

  const left =
    appStatus === 'empty'
      ? statusLabel[appStatus]
      : `${statusLabel[appStatus]} · ${folderPath || preview?.rootDir || 'No folder selected'}`;

  if (generated) {
    return { left, right: `${formatBytes(generated.outputBytes)} output` };
  }

  if (preview) {
    return {
      left,
      right: `${preview.includedFiles.length} files · ${preview.estimatedTokenCount.toLocaleString()} tokens · ${formatBytes(preview.estimatedOutputBytes)}`,
    };
  }

  return { left, right: 'No preview' };
}
