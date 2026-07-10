import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEventHandler,
  type ReactElement,
} from 'react';

import type { GenerateResult, PreviewResult } from '../../../env';
import {
  ClockIcon,
  CopyIcon,
  ExternalIcon,
  FileIcon,
  FolderIcon,
  SearchIcon,
  TableIcon,
  XIcon,
} from '../../../shared/icons/Icons';
import { cn } from '../../../shared/lib/cn';
import { Button } from '../../../shared/ui/Button';
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
  inlineFeedback: string;
};

function folderNameFromPath(folderPath: string) {
  return folderPath.split(/[\\/]/).filter(Boolean).at(-1) ?? 'Project';
}

function ProjectHeader({
  folderPath,
  preview,
  rules,
  onChooseFolder,
  onOpenRules,
}: {
  folderPath: string;
  preview: PreviewResult | null;
  rules: RulesDraft;
  onChooseFolder: () => void;
  onOpenRules: () => void;
}): ReactElement {
  const projectName = preview?.projectName || folderNameFromPath(folderPath);
  const ruleSummary = `${rules.format.toUpperCase()} · ${rules.maxFileSizeMb || '0'} MB max`;

  return (
    <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-canvas/95 px-6 py-4 backdrop-blur">
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
          Change folder
        </Button>
        <Button onClick={onOpenRules} size="sm" variant="toolbar">
          Edit rules
        </Button>
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

type FileListTab = 'included' | 'skipped' | 'ignored' | 'warnings';

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function FileListSheet({
  open,
  preview,
  initialTab,
  onClose,
}: {
  open: boolean;
  preview: PreviewResult | null;
  initialTab: FileListTab;
  onClose: () => void;
}): ReactElement | null {
  const [activeTab, setActiveTab] = useState<FileListTab>(initialTab);
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setQuery('');
    }
  }, [initialTab, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const focusableElements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    (focusableElements[0] ?? dialog).focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  const tabs: Array<{ id: FileListTab; label: string; count: number }> = [
    { id: 'included', label: 'Included', count: preview?.includedFiles.length ?? 0 },
    { id: 'skipped', label: 'Skipped', count: preview?.skippedFiles.length ?? 0 },
    { id: 'ignored', label: 'Ignored', count: preview?.ignoredDirectories.length ?? 0 },
    { id: 'warnings', label: 'Warnings', count: preview?.warnings.length ?? 0 },
  ];

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const allRows =
      activeTab === 'included'
        ? (preview?.includedFiles ?? []).map((file) => ({
            key: file.relativePath,
            primary: file.relativePath,
            secondary: file.label || file.language,
            trailing: formatBytes(file.size),
          }))
        : activeTab === 'skipped'
          ? (preview?.skippedFiles ?? []).map((file) => ({
              key: `${file.relativePath}-${file.reason}`,
              primary: file.relativePath,
              secondary: file.reason,
              trailing: 'Skipped',
            }))
          : activeTab === 'ignored'
            ? (preview?.ignoredDirectories ?? []).map((directory) => ({
                key: `${directory.path}-${directory.reason}`,
                primary: directory.path,
                secondary: directory.reason,
                trailing: 'Ignored',
              }))
            : (preview?.warnings ?? []).map((warning) => ({
                key: warning,
                primary: warning,
                secondary: 'Warning',
                trailing: '',
              }));

    if (!normalizedQuery) {
      return allRows;
    }

    return allRows.filter((row) =>
      `${row.primary} ${row.secondary}`.toLowerCase().includes(normalizedQuery),
    );
  }, [activeTab, preview, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30 flex justify-end bg-black/20 backdrop-blur-[1px]">
      <aside
        ref={dialogRef}
        aria-label="File inspection"
        aria-modal="true"
        className="flex h-full w-full max-w-[760px] flex-col overflow-hidden border-l border-line bg-window shadow-window"
        data-testid="file-inspection-dialog"
        role="dialog"
        tabIndex={-1}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">File inspection</h2>
            <p className="mt-1 text-[12px] text-muted">
              Inspect included, skipped, ignored, and warning details before generation.
            </p>
          </div>
          <Button
            aria-label="Close file inspection"
            leftIcon={<XIcon className="h-3.5 w-3.5" />}
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            Close
          </Button>
        </div>
        <div className="shrink-0 border-b border-line px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                aria-pressed={activeTab === tab.id}
                className={cn(
                  'h-8 rounded-[8px] px-3 text-[12px] font-medium transition',
                  activeTab === tab.id
                    ? 'bg-black/[0.075] text-ink'
                    : 'text-muted hover:bg-black/[0.04] hover:text-ink',
                )}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label} · {tab.count}
              </button>
            ))}
          </div>
          <label className="mt-3 flex h-9 items-center gap-2 rounded-[9px] border border-line bg-white px-3">
            <SearchIcon className="h-4 w-4 shrink-0 text-muted" />
            <span className="sr-only">Search file inspection rows</span>
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-ink outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search paths, reasons, or warnings"
              value={query}
            />
          </label>
        </div>
        <div className="scroll-surface min-h-0 flex-1 overflow-auto p-5">
          {rows.length === 0 ? (
            <p className="rounded-[10px] border border-line bg-white/76 p-4 text-[13px] text-muted">
              No rows match this view.
            </p>
          ) : (
            <div className="overflow-hidden rounded-[10px] border border-line bg-white/86">
              <table className="w-full table-fixed border-collapse text-left text-[12px]">
                <thead className="bg-black/[0.035] text-[10px] uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Path or message</th>
                    <th className="w-44 px-3 py-2 font-semibold">Detail</th>
                    <th className="w-24 px-3 py-2 text-right font-semibold">State</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-t border-line">
                      <td className="truncate px-3 py-2 text-ink/86" title={row.primary}>
                        {row.primary}
                      </td>
                      <td className="truncate px-3 py-2 text-muted" title={row.secondary}>
                        {row.secondary}
                      </td>
                      <td className="truncate px-3 py-2 text-right text-muted">{row.trailing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function PreviewPanel({
  preview,
  generated,
  onOpenFileList,
}: {
  preview: PreviewResult | null;
  generated: GenerateResult | null;
  onOpenFileList: (tab: FileListTab) => void;
}): ReactElement {
  const metrics = toPreviewMetrics(preview);
  return (
    <section className="rounded-[10px] border border-line bg-white/86">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Preview</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            Review the bundle before generating output.
          </p>
        </div>
        <Button
          disabled={!preview}
          leftIcon={<TableIcon className="h-3.5 w-3.5" />}
          onClick={() => onOpenFileList('included')}
          size="sm"
          variant="toolbar"
        >
          Review files
        </Button>
      </div>
      <div className="grid grid-cols-4 divide-x divide-line border-b border-line bg-black/[0.018]">
        {[
          ['Included', String(metrics.includedFiles)],
          ['Skipped', String(metrics.skippedFiles)],
          ['Tokens', metrics.estimatedTokens],
          ['Estimate', metrics.estimatedOutput],
        ].map(([label, value]) => (
          <button
            key={label}
            className="px-4 py-3 text-left transition hover:bg-black/[0.025]"
            disabled={!preview}
            onClick={() => {
              if (label === 'Included') onOpenFileList('included');
              if (label === 'Skipped') onOpenFileList('skipped');
              if (label === 'Estimate' || label === 'Tokens') onOpenFileList('included');
            }}
            type="button"
          >
            <div className="text-[11px] font-medium text-muted">{label}</div>
            <div className="mt-1 truncate text-[16px] font-semibold text-ink">{value}</div>
          </button>
        ))}
      </div>
      {preview?.warnings.length ? (
        <div className="border-b border-warning/20 bg-warning-soft px-4 py-2 text-[12px] leading-5 text-warning-strong">
          {preview.warnings[0]}
          {preview.warnings.length > 1 ? ` +${preview.warnings.length - 1} more` : ''}
        </div>
      ) : null}
      {preview ? (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-[12px] font-medium text-ink/82">Included files</h3>
              <p className="mt-0.5 text-[11px] text-muted">
                Showing summary only. Open the inspection sheet for the full list.
              </p>
            </div>
            <Button
              leftIcon={<TableIcon className="h-3.5 w-3.5" />}
              onClick={() => onOpenFileList('included')}
              size="sm"
              variant="toolbar"
            >
              View all {preview.includedFiles.length}
            </Button>
          </div>
          {preview.fileTypes.length === 0 ? null : (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {preview.fileTypes.slice(0, 8).map((type) => (
                <button
                  key={type.label}
                  className="rounded-[7px] border border-line bg-black/[0.025] px-2 py-1 text-[11px] text-muted transition hover:bg-black/[0.045] hover:text-ink"
                  onClick={() => onOpenFileList('included')}
                  type="button"
                >
                  {type.label} {type.count} ({type.percentage}%)
                </button>
              ))}
              {preview.fileTypes.length > 8 ? (
                <button
                  className="rounded-[7px] border border-line bg-black/[0.025] px-2 py-1 text-[11px] text-muted transition hover:bg-black/[0.045] hover:text-ink"
                  onClick={() => onOpenFileList('included')}
                  type="button"
                >
                  +{preview.fileTypes.length - 8} more
                </button>
              ) : null}
            </div>
          )}
        </div>
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
}: {
  busy: boolean;
  phase: string;
  progressCounts: { processed?: number; total?: number };
  preview: PreviewResult | null;
}): ReactElement {
  const total = progressCounts.total ?? preview?.includedFiles.length ?? 0;
  const processed = progressCounts.processed ?? 0;
  const progress = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  if (!busy) {
    return <></>;
  }

  return (
    <section className="rounded-[10px] border border-line bg-white/86 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Pipeline</h2>
          <p className="mt-0.5 text-[12px] text-muted">{phase || 'Working'}</p>
        </div>
        <span
          className={cn(
            'rounded-[7px] px-2 py-1 text-[11px] font-medium',
            'bg-warning-soft text-warning-strong',
          )}
        >
          Running
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.max(progress, 8)}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] text-muted">
        <div className="rounded-[8px] bg-black/[0.035] p-2">
          <div className="font-medium text-ink">{preview ? 'Ready' : 'Pending'}</div>
          <div>Preview</div>
        </div>
        <div className="rounded-[8px] bg-black/[0.035] p-2">
          <div className="font-medium text-ink">{`${processed}/${total || '-'}`}</div>
          <div>Generate</div>
        </div>
        <div className="rounded-[8px] bg-black/[0.035] p-2">
          <div className="font-medium text-ink">Preparing</div>
          <div>Generated output</div>
        </div>
      </div>
    </section>
  );
}

function OutputEditor({
  generated,
  savedFilePath,
  inlineFeedback,
  onCopy,
  onSave,
  onOpenSavedFile,
  onRevealSavedFile,
  onClearOutput,
}: {
  generated: GenerateResult | null;
  savedFilePath: string | null;
  inlineFeedback: string;
  onCopy: () => void;
  onSave: () => void;
  onOpenSavedFile: () => void;
  onRevealSavedFile: () => void;
  onClearOutput: () => void;
}): ReactElement {
  const hasOutput = Boolean(generated?.output);

  if (!hasOutput) {
    return (
      <section className="flex select-none items-center justify-between gap-3 rounded-[10px] border border-line bg-white/86 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-ink">Generated output</h2>
          <p className="mt-0.5 truncate text-[12px] text-muted">
            Generate to unlock copy, save, open, and reveal.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-[8px] border border-dashed border-line bg-black/[0.018] px-2.5 py-1.5 text-[12px] font-medium text-ink/64">
          <FileIcon className="h-3.5 w-3.5" />
          Output waiting
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-[clamp(240px,32vh,360px)] flex-col rounded-[10px] border border-line bg-white/86">
      <div className="flex select-none items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-[14px] font-semibold text-ink">Generated output</h2>
          <p className="mt-0.5 text-[12px] text-muted">
            {generated.format} · {formatBytes(generated.outputBytes)}
          </p>
          {inlineFeedback ? (
            <p className="mt-1 text-[12px] font-medium text-success-strong">{inlineFeedback}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <Button
            leftIcon={<CopyIcon className="h-3.5 w-3.5" />}
            onClick={onCopy}
            size="sm"
            variant="primary"
          >
            Copy
          </Button>
          <Button
            leftIcon={<FileIcon className="h-3.5 w-3.5" />}
            onClick={onSave}
            size="sm"
            variant="secondary"
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
          <Button onClick={onClearOutput} size="sm" variant="ghost">
            Clear output
          </Button>
        </div>
      </div>
      <textarea
        className="native-output scroll-surface min-h-0 flex-1 resize-none border-0 bg-transparent p-4 font-mono text-[12px] leading-5 text-ink outline-none"
        readOnly
        value={generated.output}
      />
    </section>
  );
}

function ProjectsView(props: WorkspaceProps): ReactElement {
  const [fileListTab, setFileListTab] = useState<FileListTab>('included');
  const [fileListOpen, setFileListOpen] = useState(false);

  function openFileList(tab: FileListTab): void {
    setFileListTab(tab);
    setFileListOpen(true);
  }

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
      className={cn(
        'scroll-surface min-h-0 overflow-auto',
        props.isDragging && 'bg-accent-soft/50',
      )}
      onDragEnter={props.onDragEnter}
      onDragLeave={props.onDragLeave}
      onDragOver={props.onDragOver}
      onDrop={props.onDrop}
    >
      <ProjectHeader
        folderPath={props.folderPath}
        onChooseFolder={props.onChooseFolder}
        onOpenRules={props.onOpenRules}
        preview={props.preview}
        rules={props.rules}
      />
      <div className="grid gap-4 p-5 pb-14">
        <PreviewPanel
          generated={props.generated}
          onOpenFileList={openFileList}
          preview={props.preview}
        />
        <PipelinePanel
          busy={props.busy}
          phase={props.phase}
          preview={props.preview}
          progressCounts={props.progressCounts}
        />
        <OutputEditor
          generated={props.generated}
          inlineFeedback={props.inlineFeedback}
          onClearOutput={props.onClearOutput}
          onCopy={props.onCopy}
          onOpenSavedFile={props.onOpenSavedFile}
          onRevealSavedFile={props.onRevealSavedFile}
          onSave={props.onSave}
          savedFilePath={props.savedFilePath}
        />
      </div>
      <FileListSheet
        initialTab={fileListTab}
        onClose={() => setFileListOpen(false)}
        open={fileListOpen}
        preview={props.preview}
      />
    </div>
  );
}

function RunsView({ runs }: { runs: RunRecord[] }): ReactElement {
  return (
    <div className="scroll-surface min-h-0 overflow-auto p-6 pb-14">
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

export function Workspace(props: WorkspaceProps): ReactElement {
  return (
    <main className="relative min-h-0 bg-canvas">
      {props.selectedView === 'projects' ? <ProjectsView {...props} /> : null}
      {props.selectedView === 'runs' ? <RunsView runs={props.runs} /> : null}
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
