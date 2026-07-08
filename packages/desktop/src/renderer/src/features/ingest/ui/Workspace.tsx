import type { DragEventHandler, ReactElement } from 'react';

import type { GenerateResult, PreviewResult } from '../../../env';
import {
  ClockIcon,
  CopyIcon,
  ExternalIcon,
  FileIcon,
  FolderIcon,
  PlayIcon,
  SettingsIcon,
  TableIcon,
} from '../../../shared/icons/Icons';
import { cn } from '../../../shared/lib/cn';
import { Button } from '../../../shared/ui/Button';
import { SegmentedControl } from '../../../shared/ui/SegmentedControl';
import type { AppView, RulesDraft, RunRecord } from '../model/types';
import { formatBytes, toPreviewMetrics } from '../model/view-model';
import { RulesSheet } from './RulesSheet';

export type WorkspaceProps = {
  selectedView: AppView;
  folderPath: string;
  preview: PreviewResult | null;
  generated: GenerateResult | null;
  runs: RunRecord[];
  rules: RulesDraft;
  busy: boolean;
  readyToGenerate: boolean;
  phase: string;
  progressCounts: { processed?: number; total?: number };
  isDragging: boolean;
  rulesOpen: boolean;
  savedFilePath: string | null;
  onChooseFolder: () => void;
  onGenerate: () => void;
  onCancel: () => void;
  onCopy: () => void;
  onSave: () => void;
  onOpenSavedFile: () => void;
  onRevealSavedFile: () => void;
  onClearOutput: () => void;
  onOpenRules: () => void;
  onCloseRules: () => void;
  onRulesChange: (rules: RulesDraft) => void;
  onAddPattern: (kind: 'include' | 'exclude') => void;
  onRemovePattern: (kind: 'include' | 'exclude', pattern: string) => void;
  onDragEnter: DragEventHandler<HTMLDivElement>;
  onDragLeave: DragEventHandler<HTMLDivElement>;
  onDragOver: DragEventHandler<HTMLDivElement>;
  onDrop: DragEventHandler<HTMLDivElement>;
};

const formatItems = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'text', label: 'Text' },
] as const;

function folderNameFromPath(folderPath: string) {
  return folderPath.split(/[\\/]/).filter(Boolean).at(-1) ?? 'Project';
}

function ProjectHeader({
  folderPath,
  preview,
  rules,
  busy,
  readyToGenerate,
  onChooseFolder,
  onGenerate,
  onCancel,
  onOpenRules,
}: {
  folderPath: string;
  preview: PreviewResult | null;
  rules: RulesDraft;
  busy: boolean;
  readyToGenerate: boolean;
  onChooseFolder: () => void;
  onGenerate: () => void;
  onCancel: () => void;
  onOpenRules: () => void;
}): ReactElement {
  const projectName = preview?.projectName || folderNameFromPath(folderPath);
  const ruleSummary = `${rules.format.toUpperCase()} - ${rules.maxFileSizeMb || '0'} MB max`;

  return (
    <div className="flex items-start justify-between gap-4 border-b border-line bg-white/72 px-6 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-line bg-white text-accent">
          <FolderIcon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[17px] font-semibold text-ink">{projectName}</h1>
            <span className="rounded-[6px] border border-success/24 bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success-strong">
              Local
            </span>
          </div>
          <p className="mt-1 truncate text-[12px] text-muted" title={folderPath}>
            {folderPath}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
            <span className="rounded-[6px] bg-black/[0.045] px-2 py-1">{ruleSummary}</span>
            <span className="rounded-[6px] bg-black/[0.045] px-2 py-1">
              {rules.includePatterns.length + rules.excludePatterns.length} custom patterns
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button onClick={onChooseFolder} size="sm" variant="toolbar">
          Choose
        </Button>
        <Button onClick={onOpenRules} size="sm" variant="toolbar">
          Edit Rules
        </Button>
        {busy ? (
          <Button onClick={onCancel} size="sm" variant="danger">
            Cancel
          </Button>
        ) : (
          <Button
            disabled={!readyToGenerate}
            leftIcon={<PlayIcon className="h-3.5 w-3.5" />}
            onClick={onGenerate}
            size="sm"
            variant="primary"
          >
            Generate
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyProjects({
  isDragging,
  onChooseFolder,
  dragHandlers,
}: {
  isDragging: boolean;
  onChooseFolder: () => void;
  dragHandlers: Pick<WorkspaceProps, 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop'>;
}): ReactElement {
  return (
    <div
      className={cn(
        'm-6 flex min-h-[420px] flex-col items-center justify-center rounded-[16px] border border-dashed border-line-strong bg-white/62 p-8 text-center transition',
        isDragging ? 'border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(10,132,255,0.22)]' : null,
      )}
      onDragEnter={dragHandlers.onDragEnter}
      onDragLeave={dragHandlers.onDragLeave}
      onDragOver={dragHandlers.onDragOver}
      onDrop={dragHandlers.onDrop}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-accent text-white shadow-[0_12px_30px_rgba(10,132,255,0.22)]">
        <FolderIcon className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-[20px] font-semibold text-ink">Choose a project folder</h1>
      <p className="mt-2 max-w-[420px] text-[13px] leading-6 text-muted">
        Drop a local repository here or choose a folder to preview the files that will be included.
      </p>
      <Button className="mt-5" onClick={onChooseFolder} variant="primary">
        Choose Folder
      </Button>
    </div>
  );
}

function PreviewPanel({ preview }: { preview: PreviewResult | null }): ReactElement {
  const metrics = toPreviewMetrics(preview);
  const rows = preview?.includedFiles.slice(0, 12) ?? [];

  return (
    <section className="rounded-[10px] border border-line bg-white/86">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Preview</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Review the bundle before generating output.
          </p>
        </div>
        <TableIcon className="h-4 w-4 text-muted" />
      </div>
      <div className="grid grid-cols-4 divide-x divide-line border-b border-line bg-black/[0.018]">
        {[
          ['Included', String(metrics.includedFiles)],
          ['Skipped', String(metrics.skippedFiles)],
          ['Tokens', metrics.estimatedTokens],
          ['Estimate', metrics.estimatedOutput],
        ].map(([label, value]) => (
          <div key={label} className="px-4 py-3">
            <div className="text-[11px] font-medium text-muted">{label}</div>
            <div className="mt-1 truncate text-[16px] font-semibold text-ink">{value}</div>
          </div>
        ))}
      </div>
      {preview ? (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[12px] font-medium text-ink/82 hover:bg-black/[0.025]">
            <span>Included files</span>
            <span className="text-[11px] font-normal text-muted">
              Showing {rows.length} of {preview.includedFiles.length}
            </span>
          </summary>
          <div className="border-t border-line px-4 py-3">
            {preview.fileTypes.length === 0 ? null : (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {preview.fileTypes.map((type) => (
                  <span
                    key={type.label}
                    className="rounded-[7px] border border-line bg-black/[0.025] px-2 py-1 text-[11px] text-muted"
                  >
                    {type.label} {type.count} ({type.percentage}%)
                  </span>
                ))}
              </div>
            )}
            <div className="overflow-hidden rounded-[10px] border border-line">
              <table className="w-full table-fixed border-collapse text-left text-[12px]">
                <thead className="bg-black/[0.035] text-[10px] uppercase tracking-[0.12em] text-ink/40">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Path</th>
                    <th className="w-28 px-3 py-2 font-semibold">Type</th>
                    <th className="w-24 px-3 py-2 text-right font-semibold">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((file) => (
                    <tr key={file.relativePath} className="border-t border-line">
                      <td className="truncate px-3 py-2 text-ink/86">{file.relativePath}</td>
                      <td className="truncate px-3 py-2 text-muted">
                        {file.label || file.language}
                      </td>
                      <td className="px-3 py-2 text-right text-muted">{formatBytes(file.size)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      ) : (
        <p className="px-4 py-4 text-[12px] text-muted">Preview starts after folder selection.</p>
      )}
    </section>
  );
}

function PipelinePanel({
  busy,
  phase,
  progressCounts,
  preview,
  generated,
}: {
  busy: boolean;
  phase: string;
  progressCounts: { processed?: number; total?: number };
  preview: PreviewResult | null;
  generated: GenerateResult | null;
}): ReactElement {
  const total = progressCounts.total ?? preview?.includedFiles.length ?? 0;
  const processed = progressCounts.processed ?? 0;
  const progress = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <section className="rounded-[10px] border border-line bg-white/86 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Pipeline</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {phase || (generated ? 'Generated' : preview ? 'Ready' : 'Waiting')}
          </p>
        </div>
        <span
          className={cn(
            'rounded-[7px] px-2 py-1 text-[11px] font-medium',
            busy ? 'bg-warning-soft text-warning-strong' : 'bg-success-soft text-success-strong',
          )}
        >
          {busy ? 'Running' : 'Idle'}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${busy ? Math.max(progress, 8) : generated ? 100 : 0}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] text-muted">
        <div className="rounded-[8px] bg-black/[0.035] p-2">
          <div className="font-medium text-ink">{preview ? 'Ready' : 'Pending'}</div>
          <div>Preview</div>
        </div>
        <div className="rounded-[8px] bg-black/[0.035] p-2">
          <div className="font-medium text-ink">
            {busy ? `${processed}/${total || '-'}` : generated ? 'Complete' : 'Idle'}
          </div>
          <div>Generate</div>
        </div>
        <div className="rounded-[8px] bg-black/[0.035] p-2">
          <div className="font-medium text-ink">
            {generated ? formatBytes(generated.outputBytes) : '-'}
          </div>
          <div>Generated output</div>
        </div>
      </div>
    </section>
  );
}

function OutputEditor({
  generated,
  savedFilePath,
  onCopy,
  onSave,
  onOpenSavedFile,
  onRevealSavedFile,
  onClearOutput,
}: {
  generated: GenerateResult | null;
  savedFilePath: string | null;
  onCopy: () => void;
  onSave: () => void;
  onOpenSavedFile: () => void;
  onRevealSavedFile: () => void;
  onClearOutput: () => void;
}): ReactElement {
  const hasOutput = Boolean(generated?.output);

  return (
    <section className="flex min-h-[260px] flex-col rounded-[10px] border border-line bg-white/86">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Generated output</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {generated
              ? `${generated.format} - ${formatBytes(generated.outputBytes)}`
              : 'Generate to unlock copy, save, open, and reveal.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            disabled={!hasOutput}
            leftIcon={<CopyIcon className="h-3.5 w-3.5" />}
            onClick={onCopy}
            size="sm"
          >
            Copy
          </Button>
          <Button
            disabled={!hasOutput}
            leftIcon={<FileIcon className="h-3.5 w-3.5" />}
            onClick={onSave}
            size="sm"
            variant={hasOutput ? 'primary' : 'secondary'}
          >
            Save
          </Button>
          <Button
            disabled={!savedFilePath}
            leftIcon={<ExternalIcon className="h-3.5 w-3.5" />}
            onClick={onOpenSavedFile}
            size="sm"
            variant="toolbar"
          >
            Open
          </Button>
          <Button
            disabled={!savedFilePath}
            leftIcon={<FolderIcon className="h-3.5 w-3.5" />}
            onClick={onRevealSavedFile}
            size="sm"
            variant="toolbar"
          >
            Reveal
          </Button>
          <Button disabled={!hasOutput} onClick={onClearOutput} size="sm" variant="ghost">
            Clear
          </Button>
        </div>
      </div>
      <textarea
        className="min-h-0 flex-1 resize-none border-0 bg-transparent p-4 font-mono text-[12px] leading-5 text-ink outline-none"
        readOnly
        value={generated?.output ?? ''}
        placeholder="Generated content will appear here."
      />
    </section>
  );
}

function ProjectsView(props: WorkspaceProps): ReactElement {
  if (!props.folderPath) {
    return (
      <EmptyProjects
        dragHandlers={{
          onDragEnter: props.onDragEnter,
          onDragLeave: props.onDragLeave,
          onDragOver: props.onDragOver,
          onDrop: props.onDrop,
        }}
        isDragging={props.isDragging}
        onChooseFolder={props.onChooseFolder}
      />
    );
  }

  return (
    <div
      className={cn('min-h-0 overflow-auto', props.isDragging && 'bg-accent-soft/50')}
      onDragEnter={props.onDragEnter}
      onDragLeave={props.onDragLeave}
      onDragOver={props.onDragOver}
      onDrop={props.onDrop}
    >
      <ProjectHeader
        busy={props.busy}
        folderPath={props.folderPath}
        onCancel={props.onCancel}
        onChooseFolder={props.onChooseFolder}
        onGenerate={props.onGenerate}
        onOpenRules={props.onOpenRules}
        preview={props.preview}
        readyToGenerate={props.readyToGenerate}
        rules={props.rules}
      />
      <div className="grid gap-4 p-5">
        <PreviewPanel preview={props.preview} />
        <PipelinePanel
          busy={props.busy}
          generated={props.generated}
          phase={props.phase}
          preview={props.preview}
          progressCounts={props.progressCounts}
        />
        <OutputEditor
          generated={props.generated}
          onClearOutput={props.onClearOutput}
          onCopy={props.onCopy}
          onOpenSavedFile={props.onOpenSavedFile}
          onRevealSavedFile={props.onRevealSavedFile}
          onSave={props.onSave}
          savedFilePath={props.savedFilePath}
        />
      </div>
    </div>
  );
}

function RunsView({ runs }: { runs: RunRecord[] }): ReactElement {
  return (
    <div className="min-h-0 overflow-auto p-6">
      <div className="mb-4 flex items-center gap-2">
        <ClockIcon className="h-4 w-4 text-accent" />
        <h1 className="text-[18px] font-semibold text-ink">Runs</h1>
      </div>
      {runs.length === 0 ? (
        <div className="rounded-[14px] border border-line bg-white/76 p-6 text-[13px] text-muted shadow-panel">
          Runs from this app session will appear here after generation.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[14px] border border-line bg-white/76 shadow-panel">
          <table className="w-full table-fixed border-collapse text-left text-[12px]">
            <thead className="bg-black/[0.035] text-[10px] uppercase tracking-[0.12em] text-ink/40">
              <tr>
                <th className="px-3 py-2 font-semibold">Project</th>
                <th className="w-28 px-3 py-2 font-semibold">Created</th>
                <th className="w-28 px-3 py-2 text-right font-semibold">Tokens</th>
                <th className="w-28 px-3 py-2 text-right font-semibold">Output</th>
                <th className="w-24 px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-t border-line">
                  <td className="truncate px-3 py-2 text-ink/86">{run.projectName}</td>
                  <td className="px-3 py-2 text-muted">{run.createdAt}</td>
                  <td className="px-3 py-2 text-right text-muted">
                    {run.tokenCount.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-muted">
                    {formatBytes(run.outputBytes)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-[7px] bg-black/[0.04] px-2 py-1 text-[11px] text-ink/72">
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsView({
  rules,
  onRulesChange,
  onAddPattern,
  onRemovePattern,
}: Pick<
  WorkspaceProps,
  'rules' | 'onRulesChange' | 'onAddPattern' | 'onRemovePattern'
>): ReactElement {
  return (
    <div className="min-h-0 overflow-auto p-6">
      <div className="mb-4 flex items-center gap-2">
        <SettingsIcon className="h-4 w-4 text-accent" />
        <h1 className="text-[18px] font-semibold text-ink">Settings</h1>
      </div>
      <section className="rounded-[14px] border border-line bg-white/76 p-5 shadow-panel">
        <div className="grid gap-5">
          <div>
            <div className="mb-2 text-[12px] font-medium text-ink/82">Default format</div>
            <SegmentedControl
              ariaLabel="Settings output format"
              items={formatItems}
              onChange={(format) => onRulesChange({ ...rules, format })}
              selected={rules.format}
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-ink/82" htmlFor="settings-max-file-size">
              Max file size
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                className="h-9 w-28 rounded-[9px] border border-line bg-white/80 px-3 py-0 text-[13px] text-ink outline-none focus:border-accent"
                id="settings-max-file-size"
                min="0.1"
                onChange={(event) => onRulesChange({ ...rules, maxFileSizeMb: event.target.value })}
                step="0.1"
                type="number"
                value={rules.maxFileSizeMb}
              />
              <span className="text-[12px] text-muted">MB per file</span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(['include', 'exclude'] as const).map((kind) => {
              const inputKey = kind === 'include' ? 'includeInput' : 'excludeInput';
              const listKey = kind === 'include' ? 'includePatterns' : 'excludePatterns';

              return (
                <div key={kind} className="rounded-[12px] border border-line bg-black/[0.025] p-3">
                  <label
                    className="text-[12px] font-medium capitalize text-ink/82"
                    htmlFor={`settings-${kind}`}
                  >
                    {kind} patterns
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="h-9 min-w-0 flex-1 rounded-[9px] border border-line bg-white/80 px-3 py-0 text-[13px] text-ink outline-none focus:border-accent"
                      id={`settings-${kind}`}
                      onChange={(event) =>
                        onRulesChange({ ...rules, [inputKey]: event.target.value })
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          onAddPattern(kind);
                        }
                      }}
                      value={rules[inputKey]}
                    />
                    <Button onClick={() => onAddPattern(kind)} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rules[listKey].map((pattern) => (
                      <button
                        key={pattern}
                        className="inline-flex h-7 max-w-full items-center gap-1 rounded-[8px] border border-line bg-white/72 px-2 py-0 text-[12px] text-ink/78"
                        onClick={() => onRemovePattern(kind, pattern)}
                        title={`Remove ${pattern}`}
                        type="button"
                      >
                        <span className="truncate">{pattern}</span>
                        <span aria-hidden="true" className="text-muted">
                          x
                        </span>
                      </button>
                    ))}
                    {rules[listKey].length === 0 ? (
                      <p className="text-[12px] text-muted">No patterns.</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export function Workspace(props: WorkspaceProps): ReactElement {
  return (
    <main className="relative min-h-0 bg-canvas">
      {props.selectedView === 'projects' ? <ProjectsView {...props} /> : null}
      {props.selectedView === 'runs' ? <RunsView runs={props.runs} /> : null}
      {props.selectedView === 'settings' ? (
        <SettingsView
          onAddPattern={props.onAddPattern}
          onRemovePattern={props.onRemovePattern}
          onRulesChange={props.onRulesChange}
          rules={props.rules}
        />
      ) : null}
      {props.rulesOpen ? (
        <RulesSheet
          onAddPattern={props.onAddPattern}
          onClose={props.onCloseRules}
          onRemovePattern={props.onRemovePattern}
          onRulesChange={props.onRulesChange}
          rules={props.rules}
        />
      ) : null}
    </main>
  );
}
