import type { ReactElement, ReactNode } from 'react'

import type { DesktopError, GenerateResult, PreviewResult } from '../../../env'
import { CheckIcon, CopyIcon, ExternalIcon, FileIcon, FolderIcon, ShieldIcon } from '../../../shared/icons/Icons'
import { Button } from '../../../shared/ui/Button'
import { MetricCard } from '../../../shared/ui/MetricCard'
import { formatBytes, toPreviewMetrics } from '../model/view-model'

export type InspectorProps = {
  preview: PreviewResult | null
  generated: GenerateResult | null
  savedFilePath: string | null
  error: DesktopError | null
  message: string
  onCopy: () => void
  onSave: () => void
  onOpenSavedFile: () => void
  onRevealSavedFile: () => void
  onClearOutput: () => void
}

function InspectorSection({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section className="border-b border-line px-4 py-4">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/38">{title}</h2>
      {children}
    </section>
  )
}

export function Inspector({
  preview,
  generated,
  savedFilePath,
  error,
  message,
  onCopy,
  onSave,
  onOpenSavedFile,
  onRevealSavedFile,
  onClearOutput
}: InspectorProps): ReactElement {
  const metrics = toPreviewMetrics(preview)
  const hasOutput = Boolean(generated?.output)
  const warnings = preview?.warnings ?? []
  const ignoredDirectories = preview?.ignoredDirectories ?? []

  return (
    <aside className="native-inspector min-h-0 overflow-auto border-l border-line">
      <InspectorSection title="Preview">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Included" value={String(metrics.includedFiles)} />
          <MetricCard label="Skipped" value={String(metrics.skippedFiles)} />
          <MetricCard label="Tokens" value={metrics.estimatedTokens} />
          <MetricCard label="Output" value={metrics.estimatedOutput} />
        </div>
        {generated ? (
          <div className="mt-3 rounded-[10px] border border-line bg-white/70 p-3 text-[12px] text-muted">
            <div className="flex items-center justify-between gap-3">
              <span>Generated output</span>
              <span className="font-medium text-ink">{formatBytes(generated.outputBytes)}</span>
            </div>
          </div>
        ) : null}
      </InspectorSection>

      <InspectorSection title="Safety">
        <div className="space-y-2 text-[12px]">
          {['Local only', 'Read-only scan', 'No direct renderer filesystem access'].map((label) => (
            <div key={label} className="flex items-center gap-2 rounded-[9px] border border-success/20 bg-success-soft px-3 py-2 text-success-strong">
              <ShieldIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </InspectorSection>

      <InspectorSection title="Ignored">
        {ignoredDirectories.length === 0 ? (
          <p className="text-[12px] leading-5 text-muted">Ignored directories will appear after preview.</p>
        ) : (
          <div className="space-y-2">
            {ignoredDirectories.map((directory) => (
              <div key={`${directory.path}-${directory.reason}`} className="rounded-[9px] bg-black/[0.035] px-3 py-2">
                <div className="truncate text-[12px] font-medium text-ink/82">{directory.path}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted">{directory.reason}</div>
              </div>
            ))}
          </div>
        )}
      </InspectorSection>

      <InspectorSection title="Warnings">
        {warnings.length === 0 ? (
          <p className="text-[12px] leading-5 text-muted">No preview warnings.</p>
        ) : (
          <div className="space-y-2">
            {warnings.map((warning) => (
              <div key={warning} className="rounded-[9px] border border-warning/20 bg-warning-soft px-3 py-2 text-[12px] leading-5 text-warning-strong">
                {warning}
              </div>
            ))}
          </div>
        )}
      </InspectorSection>

      <InspectorSection title="Actions">
        <div className="grid grid-cols-2 gap-2">
          <Button disabled={!hasOutput} leftIcon={<CopyIcon className="h-3.5 w-3.5" />} onClick={onCopy} size="sm">
            Copy
          </Button>
          <Button disabled={!hasOutput} leftIcon={<FileIcon className="h-3.5 w-3.5" />} onClick={onSave} size="sm">
            Save
          </Button>
          <Button
            disabled={!savedFilePath}
            leftIcon={<ExternalIcon className="h-3.5 w-3.5" />}
            onClick={onOpenSavedFile}
            size="sm"
          >
            Open
          </Button>
          <Button
            disabled={!savedFilePath}
            leftIcon={<FolderIcon className="h-3.5 w-3.5" />}
            onClick={onRevealSavedFile}
            size="sm"
          >
            Reveal
          </Button>
        </div>
        <Button className="mt-2 w-full" disabled={!hasOutput} onClick={onClearOutput} size="sm" variant="ghost">
          Clear output
        </Button>
        {savedFilePath ? <p className="mt-2 truncate text-[11px] text-muted">{savedFilePath}</p> : null}
      </InspectorSection>

      {message || error ? (
        <InspectorSection title="Messages">
          {message ? (
            <div className="mb-2 flex items-start gap-2 rounded-[9px] border border-success/20 bg-success-soft px-3 py-2 text-[12px] leading-5 text-success-strong">
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}
          {error ? (
            <details className="rounded-[9px] border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] leading-5 text-danger-strong" open>
              <summary className="cursor-pointer font-medium">{error.userMessage}</summary>
              {error.detail ? <pre className="mt-2 whitespace-pre-wrap break-words text-[11px]">{error.detail}</pre> : null}
              <div className="mt-2 text-[11px] opacity-75">{error.code}</div>
            </details>
          ) : null}
        </InspectorSection>
      ) : null}
    </aside>
  )
}
