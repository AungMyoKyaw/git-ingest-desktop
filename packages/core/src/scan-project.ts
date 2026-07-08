import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

import { AppError, GitIngestError } from './errors.js';
import { generateMarkdown } from './generate-markdown.js';
import { generateText } from './generate-text.js';
import {
  isDefaultIgnoredDirectory,
  matchesPattern,
  normalizePatterns,
  readGitIgnorePatterns,
} from './ignore.js';
import { estimateTokens } from './token-estimate.js';
import type {
  FileTypeSummary,
  GenerateProjectResult,
  IgnoredDirectory,
  IncludedFile,
  OutputFormat,
  ProgressEvent,
  ProjectSummary,
  ScanProjectOptions,
  SkippedFile,
} from './types.js';

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

type LegacyScanProjectOptions = Omit<ScanProjectOptions, 'rootDir'> & { rootPath: string };

type LegacyPreviewResult = {
  totalFiles: number;
  includedFiles: number;
  skippedFiles: number;
  entries: Array<{ path: string; ignored: boolean; reason?: string }>;
  outputBytesEstimate: number;
};

type LegacyGenerateResult = GenerateProjectResult & { approximateTokens: number };

const LANGUAGE_BY_EXTENSION: Record<string, { label: string; language: string }> = {
  '.cjs': { label: 'JavaScript', language: 'js' },
  '.css': { label: 'CSS', language: 'css' },
  '.html': { label: 'HTML', language: 'html' },
  '.js': { label: 'JavaScript', language: 'js' },
  '.json': { label: 'JSON', language: 'json' },
  '.jsx': { label: 'React JSX', language: 'jsx' },
  '.md': { label: 'Markdown', language: 'md' },
  '.mjs': { label: 'JavaScript', language: 'js' },
  '.ts': { label: 'TypeScript', language: 'ts' },
  '.tsx': { label: 'React TSX', language: 'tsx' },
  '.txt': { label: 'Text', language: 'text' },
  '.yml': { label: 'YAML', language: 'yml' },
  '.yaml': { label: 'YAML', language: 'yml' },
};

interface InternalSummary extends ProjectSummary {
  includedFiles: IncludedFile[];
}

function emit(onProgress: ScanProjectOptions['onProgress'], event: ProgressEvent) {
  onProgress?.(event);
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new AppError(
      'CANCELLED',
      'Generation was cancelled.',
      'The active scan was cancelled before completion.',
    );
  }
}

function toRelativePath(rootDir: string, filePath: string) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function describeFile(relativePath: string) {
  const extension = path.extname(relativePath).toLowerCase();
  return LANGUAGE_BY_EXTENSION[extension] ?? { label: 'Other', language: 'text' };
}

function isProbablyBinary(buffer: Buffer) {
  return buffer.includes(0);
}

function buildWarnings(totalFiles: number, estimatedOutputBytes: number) {
  const warnings: string[] = [];

  if (totalFiles > 1000) {
    warnings.push('This folder is large. Preview the result before generating full output.');
  }

  if (estimatedOutputBytes > 500_000) {
    warnings.push(
      'The generated output will be large. Consider tighter excludes or a lower max file size.',
    );
  }

  return warnings;
}

function summarizeFileTypes(files: IncludedFile[]): FileTypeSummary[] {
  const counts = new Map<string, number>();

  files.forEach((file) => {
    counts.set(file.label, (counts.get(file.label) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([label, count]) => ({
      label,
      count,
      percentage: Number(((count / Math.max(1, files.length)) * 100).toFixed(1)),
    }));
}

function estimateOutputBytes(files: IncludedFile[]) {
  return files.reduce((total, file) => total + file.size + file.relativePath.length + 48, 512);
}

function estimateOutputTokens(estimatedOutputBytes: number) {
  return Math.max(1, Math.ceil(estimatedOutputBytes / 4));
}

async function countFiles(directory: string): Promise<number> {
  const entries = await readdir(directory, { withFileTypes: true });
  let total = 0;

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      total += await countFiles(fullPath);
      continue;
    }

    if (entry.isFile()) {
      total += 1;
    }
  }

  return total;
}

async function validateRootDirectory(rootDir: string) {
  if (!rootDir || typeof rootDir !== 'string') {
    throw new AppError(
      'INVALID_DIRECTORY',
      'Choose a real project folder before scanning.',
      'rootDir must be a string',
    );
  }

  try {
    await access(rootDir);
    const details = await stat(rootDir);

    if (!details.isDirectory()) {
      throw new AppError(
        'INVALID_DIRECTORY',
        'Choose a folder instead of a file.',
        `${rootDir} is not a directory`,
      );
    }
  } catch (error) {
    if (error instanceof GitIngestError || error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      'INVALID_DIRECTORY',
      'Choose a real project folder before scanning.',
      String(error),
    );
  }
}

function resolveRootDirectory(options: ScanProjectOptions | LegacyScanProjectOptions) {
  return 'rootDir' in options ? options.rootDir : options.rootPath;
}

async function collectProject(
  options: ScanProjectOptions | LegacyScanProjectOptions,
  includeContent: boolean,
): Promise<InternalSummary> {
  const rootDir = path.resolve(resolveRootDirectory(options) ?? '');
  const includePatterns = normalizePatterns(options.includePatterns);
  const excludePatterns = normalizePatterns(options.excludePatterns);
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE;
  const gitIgnorePatterns = await readGitIgnorePatterns(rootDir);

  await validateRootDirectory(rootDir);
  emit(options.onProgress, { phase: 'scanning' });

  const includedFiles: IncludedFile[] = [];
  const skippedFiles: SkippedFile[] = [];
  const ignoredDirectories: IgnoredDirectory[] = [];
  let totalFiles = 0;

  async function walk(directory: string): Promise<void> {
    throwIfAborted(options.signal);
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      throwIfAborted(options.signal);
      const fullPath = path.join(directory, entry.name);
      const relativePath = toRelativePath(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (isDefaultIgnoredDirectory(entry.name)) {
          ignoredDirectories.push({ path: relativePath, reason: 'default-ignore' });
          totalFiles += await countFiles(fullPath);
          continue;
        }

        await walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      totalFiles += 1;

      if (gitIgnorePatterns.length > 0 && matchesPattern(relativePath, gitIgnorePatterns)) {
        skippedFiles.push({ relativePath, reason: 'gitignore' });
        continue;
      }

      if (includePatterns.length > 0 && !matchesPattern(relativePath, includePatterns)) {
        skippedFiles.push({ relativePath, reason: 'include-pattern' });
        continue;
      }

      if (excludePatterns.length > 0 && matchesPattern(relativePath, excludePatterns)) {
        skippedFiles.push({ relativePath, reason: 'exclude-pattern' });
        continue;
      }

      const details = await stat(fullPath);
      if (details.size > maxFileSizeBytes) {
        skippedFiles.push({ relativePath, reason: 'max-size' });
        continue;
      }

      const buffer = await readFile(fullPath);
      if (isProbablyBinary(buffer)) {
        skippedFiles.push({ relativePath, reason: 'binary' });
        continue;
      }

      const descriptor = describeFile(relativePath);
      includedFiles.push({
        relativePath,
        size: details.size,
        label: descriptor.label,
        language: descriptor.language,
        content: includeContent ? buffer.toString('utf8') : undefined,
      });
      emit(options.onProgress, {
        phase: 'processing',
        processedFiles: includedFiles.length,
        totalFiles,
      });
      throwIfAborted(options.signal);
    }
  }

  await walk(rootDir);

  const estimatedOutputBytes = estimateOutputBytes(includedFiles);
  return {
    projectName: path.basename(rootDir),
    rootDir,
    totalFiles,
    includedFiles,
    skippedFiles,
    ignoredDirectories,
    fileTypes: summarizeFileTypes(includedFiles),
    estimatedTokenCount: estimateOutputTokens(estimatedOutputBytes),
    estimatedOutputBytes,
    warnings: buildWarnings(totalFiles, estimatedOutputBytes),
  };
}

function toLegacyPreview(summary: ProjectSummary): LegacyPreviewResult {
  const includedEntries = summary.includedFiles.map((file) => ({
    path: file.relativePath,
    ignored: false,
  }));
  const skippedEntries = summary.skippedFiles.map((file) => ({
    path: file.relativePath,
    ignored: true,
    reason: file.reason,
  }));
  const ignoredDirectoryEntries = summary.ignoredDirectories.map((directory) => ({
    path: directory.path,
    ignored: true,
    reason: directory.reason,
  }));

  return {
    totalFiles: summary.totalFiles,
    includedFiles: summary.includedFiles.length,
    skippedFiles: summary.skippedFiles.length,
    entries: [...includedEntries, ...skippedEntries, ...ignoredDirectoryEntries],
    outputBytesEstimate: summary.estimatedOutputBytes,
  };
}

export async function previewProject(options: ScanProjectOptions): Promise<ProjectSummary>;
export async function previewProject(
  options: LegacyScanProjectOptions,
): Promise<LegacyPreviewResult>;
export async function previewProject(
  options: ScanProjectOptions | LegacyScanProjectOptions,
): Promise<ProjectSummary | LegacyPreviewResult> {
  emit(options.onProgress, { phase: 'validating' });
  throwIfAborted(options.signal);
  const summary = await collectProject(options, false);
  const modernSummary: ProjectSummary = {
    ...summary,
    includedFiles: summary.includedFiles.map(({ content: _content, ...file }) => file),
  };

  if ('rootPath' in options && !('rootDir' in options)) {
    return toLegacyPreview(modernSummary);
  }

  return modernSummary;
}

export async function generateProjectOutput(
  options: ScanProjectOptions | LegacyScanProjectOptions,
): Promise<GenerateProjectResult> {
  emit(options.onProgress, { phase: 'validating' });
  throwIfAborted(options.signal);
  const format: OutputFormat = options.format ?? 'markdown';
  const summary = await collectProject(options, true);
  throwIfAborted(options.signal);
  emit(options.onProgress, {
    phase: 'writing',
    processedFiles: summary.includedFiles.length,
    totalFiles: summary.totalFiles,
  });
  throwIfAborted(options.signal);

  const output = format === 'text' ? generateText(summary) : generateMarkdown(summary);

  return {
    ...summary,
    format,
    output,
    outputBytes: Buffer.byteLength(output, 'utf8'),
    tokenEstimate: estimateTokens(output),
  };
}

export async function generateProject(
  options: LegacyScanProjectOptions,
  onProgress?: (event: ProgressEvent | { phase: 'done' }) => void,
): Promise<LegacyGenerateResult> {
  const result = await generateProjectOutput({ ...options, onProgress });
  onProgress?.({ phase: 'done' });
  return {
    ...result,
    approximateTokens: result.tokenEstimate,
  };
}
