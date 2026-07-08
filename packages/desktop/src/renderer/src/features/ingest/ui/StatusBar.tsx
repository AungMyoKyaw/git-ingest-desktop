import type { ReactElement } from 'react';

import type { GenerateResult, PreviewResult } from '../../../env';
import type { AppStatus } from '../model/types';
import { getStatusBarText } from '../model/view-model';

export type StatusBarProps = {
  folderPath: string;
  preview: PreviewResult | null;
  generated: GenerateResult | null;
  appStatus: AppStatus;
};

export function StatusBar({
  folderPath,
  preview,
  generated,
  appStatus,
}: StatusBarProps): ReactElement {
  const status = getStatusBarText({ appStatus, folderPath, preview, generated });

  return (
    <footer className="native-toolbar flex h-[26px] items-center justify-between gap-3 border-t border-line px-3 text-[11px] text-muted">
      <span className="min-w-0 truncate">{status.left}</span>
      <span className="shrink-0 truncate">{status.right}</span>
    </footer>
  );
}
