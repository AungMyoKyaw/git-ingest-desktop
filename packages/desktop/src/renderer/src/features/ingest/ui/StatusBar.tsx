import type { ReactElement } from 'react';

import type { GenerateResult, PreviewResult } from '../../../env';
import { formatBytes } from '../model/view-model';

export type StatusBarProps = {
  folderPath: string;
  preview: PreviewResult | null;
  generated: GenerateResult | null;
  phase: string;
};

export function StatusBar({ folderPath, preview, generated, phase }: StatusBarProps): ReactElement {
  const outputState = generated ? `${formatBytes(generated.outputBytes)} output` : 'No output';
  const previewState = preview
    ? `${preview.includedFiles.length} files - ${preview.estimatedTokenCount.toLocaleString()} tokens`
    : 'No preview';

  return (
    <footer className="native-toolbar grid h-[26px] grid-cols-[240px_1fr_320px] border-t border-line text-[11px] text-muted">
      <div className="flex items-center border-r border-line px-3">
        <span className="mr-2 h-1.5 w-1.5 rounded-full bg-success" />
        Local workspace
      </div>
      <div className="flex min-w-0 items-center justify-between px-3">
        <span className="truncate">{folderPath || 'No folder selected'}</span>
        <span className="ml-4 shrink-0">{previewState}</span>
      </div>
      <div className="flex items-center justify-between border-l border-line px-3">
        <span>Status: {phase || 'ready'}</span>
        <span>{outputState}</span>
      </div>
    </footer>
  );
}
