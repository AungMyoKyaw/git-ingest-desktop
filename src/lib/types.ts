export type OutputFormat = "markdown" | "text";
export type FileOverrideMode = "auto" | "include" | "exclude" | "pin";
export interface FileOverride {
  path: string;
  mode: FileOverrideMode;
}
export interface GitSummary {
  branch: string | null;
  available: boolean;
}
export interface FileEntry {
  path: string;
  sizeBytes: number;
  language: string;
  estimatedTokens: number;
  included: boolean;
  pinned: boolean;
  skipReason: string | null;
  gitStatus: string | null;
  dependencies: string[];
  relevanceScore: number;
  relevanceReasons: string[];
}
export interface IgnoredDirectory {
  path: string;
  reason: string;
}
export interface InspectRequest {
  rootPath: string;
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSizeBytes: number;
  tokenBudget: number | null;
  overrides: FileOverride[];
}
export interface InspectionResult {
  rootPath: string;
  projectName: string;
  git: GitSummary;
  entries: FileEntry[];
  ignoredDirectories: IgnoredDirectory[];
  includedFiles: number;
  skippedFiles: number;
  totalBytes: number;
  estimatedTokens: number;
  budgetTokens: number | null;
}
export interface GenerateRequest extends InspectRequest {
  format: OutputFormat;
}
export interface GenerationResult {
  output: string;
  format: OutputFormat;
  includedFiles: number;
  skippedFiles: number;
  totalBytes: number;
  approximateTokens: number;
}
export interface SavedProfile {
  id: string;
  name: string;
  includePatterns: string[];
  excludePatterns: string[];
  maxFileSizeBytes: number;
  tokenBudget: number | null;
  format: string;
}
export interface Settings {
  appearance: "system" | "light" | "dark";
  liveRefresh: boolean;
  selectedPreset: string;
}
export interface PersistedState {
  recentProjects: string[];
  profiles: SavedProfile[];
  settings: Settings;
  lastExportPath: string | null;
}
export type Workspace = "project" | "context" | "rules" | "output";
export type EntryFilter = "all" | "included" | "changed" | "source" | "docs" | "tests" | "skipped";
export interface NativeClient {
  chooseProject(): Promise<string | null>;
  inspect(request: InspectRequest): Promise<InspectionResult>;
  preview(root: string, path: string): Promise<string>;
  diff(root: string, path: string): Promise<string>;
  generate(request: GenerateRequest): Promise<GenerationResult>;
  loadState(): Promise<PersistedState>;
  saveState(state: PersistedState): Promise<void>;
  copyOutput(text: string): Promise<void>;
  saveOutput(text: string, format: OutputFormat, suggestedName: string): Promise<string | null>;
  openOutput(path: string): Promise<void>;
  revealOutput(path: string): Promise<void>;
  startWatch(root: string): Promise<void>;
  stopWatch(): Promise<void>;
  onProjectChanged(callback: () => void): Promise<() => void>;
  onProjectDrop(callback: (path: string) => void): Promise<() => void>;
}
