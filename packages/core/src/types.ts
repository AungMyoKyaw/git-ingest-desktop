export type OutputFormat = 'markdown' | 'text';

export type ProgressPhase = 'validating' | 'scanning' | 'processing' | 'writing';

export interface ProgressEvent {
  phase: ProgressPhase;
  processedFiles?: number;
  totalFiles?: number;
}

export interface ScanProjectOptions {
  rootDir: string;
  format?: OutputFormat;
  maxFileSizeBytes?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  onProgress?: (event: ProgressEvent) => void;
  signal?: AbortSignal;
}

export interface IncludedFile {
  relativePath: string;
  size: number;
  label: string;
  language: string;
  content?: string;
}

export interface SkippedFile {
  relativePath: string;
  reason: 'include-pattern' | 'exclude-pattern' | 'gitignore' | 'max-size' | 'binary';
}

export interface IgnoredDirectory {
  path: string;
  reason: 'default-ignore' | 'gitignore' | 'exclude-pattern';
}

export interface FileTypeSummary {
  label: string;
  count: number;
  percentage: number;
}

export interface ProjectSummary {
  projectName: string;
  rootDir: string;
  totalFiles: number;
  includedFiles: IncludedFile[];
  skippedFiles: SkippedFile[];
  ignoredDirectories: IgnoredDirectory[];
  fileTypes: FileTypeSummary[];
  estimatedTokenCount: number;
  estimatedOutputBytes: number;
  warnings: string[];
}

export interface GenerateProjectResult extends ProjectSummary {
  format: OutputFormat;
  output: string;
  outputBytes: number;
  tokenEstimate: number;
}
