import type { ReactElement, ReactNode } from 'react';

import type { DesktopError, GenerateResult, PreviewResult } from '../../../env';
import { CheckIcon, ShieldIcon } from '../../../shared/icons/Icons';
import { formatBytes } from '../model/view-model';

export type InspectorProps = {
  preview: PreviewResult | null;
  generated: GenerateResult | null;
  error: DesktopError | null;
  message: string;
};

function InspectorSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement {
  return (
    <section className="border-b border-line px-4 py-3.5">
      <h2 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/38">
        {title}
      </h2>
      {children}
    </section>
  );
}

function InspectorRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-muted">{label}</span>
      <span className="min-w-0 truncate text-right font-medium text-ink/86">{value}</span>
    </div>
  );
}

export function Inspector({ preview, generated, error, message }: InspectorProps): ReactElement {
  const warnings = preview?.warnings ?? [];
  const ignoredDirectories = preview?.ignoredDirectories ?? [];
  const output = generated
    ? formatBytes(generated.outputBytes)
    : preview
      ? formatBytes(preview.estimatedOutputBytes)
      : '-';

  return (
    <aside className="native-inspector min-h-0 overflow-auto border-l border-line">
      <InspectorSection title="Summary">
        <div className="space-y-2 rounded-[8px] border border-line bg-white/70 px-3 py-2.5">
          <InspectorRow
            label="Files"
            value={preview ? String(preview.includedFiles.length) : '-'}
          />
          <InspectorRow
            label="Tokens"
            value={preview ? preview.estimatedTokenCount.toLocaleString() : '-'}
          />
          <InspectorRow label={generated ? 'Output' : 'Estimate'} value={output} />
          <InspectorRow label="Format" value={generated?.format ?? 'markdown'} />
        </div>
      </InspectorSection>

      <InspectorSection title="Safety">
        <div className="space-y-1.5 text-[12px]">
          {['Local only', 'Read-only scan', 'Renderer has no direct filesystem access'].map(
            (label) => (
              <div key={label} className="flex items-center gap-2 text-success-strong">
                <ShieldIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 truncate">{label}</span>
              </div>
            ),
          )}
        </div>
      </InspectorSection>

      <InspectorSection title="Ignored">
        {ignoredDirectories.length === 0 ? (
          <p className="text-[12px] leading-5 text-muted">No ignored directories yet.</p>
        ) : (
          <details>
            <summary className="cursor-pointer text-[12px] font-medium text-ink/82">
              {ignoredDirectories.length} ignored{' '}
              {ignoredDirectories.length === 1 ? 'directory' : 'directories'}
            </summary>
            <div className="mt-2 space-y-1.5">
              {ignoredDirectories.map((directory) => (
                <div
                  key={`${directory.path}-${directory.reason}`}
                  className="rounded-[8px] border border-line bg-white/54 px-2.5 py-2"
                >
                  <div className="truncate text-[12px] font-medium text-ink/82">
                    {directory.path}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-muted">{directory.reason}</div>
                </div>
              ))}
            </div>
          </details>
        )}
      </InspectorSection>

      {warnings.length > 0 ? (
        <InspectorSection title="Warnings">
          <div className="space-y-1.5">
            {warnings.map((warning) => (
              <div
                key={warning}
                className="rounded-[8px] border border-warning/20 bg-warning-soft px-2.5 py-2 text-[12px] leading-5 text-warning-strong"
              >
                {warning}
              </div>
            ))}
          </div>
        </InspectorSection>
      ) : null}

      {message || error ? (
        <InspectorSection title="Messages">
          {message ? (
            <div className="mb-2 flex items-start gap-2 rounded-[9px] border border-success/20 bg-success-soft px-3 py-2 text-[12px] leading-5 text-success-strong">
              <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}
          {error ? (
            <details
              className="rounded-[9px] border border-danger/20 bg-danger-soft px-3 py-2 text-[12px] leading-5 text-danger-strong"
              open
            >
              <summary className="cursor-pointer font-medium">{error.userMessage}</summary>
              {error.detail ? (
                <pre className="mt-2 whitespace-pre-wrap break-words text-[11px]">
                  {error.detail}
                </pre>
              ) : null}
              <div className="mt-2 text-[11px] opacity-75">{error.code}</div>
            </details>
          ) : null}
        </InspectorSection>
      ) : null}
    </aside>
  );
}
