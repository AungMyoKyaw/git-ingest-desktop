import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PreviewResult } from '../../../env';
import { FileListSheet } from './Workspace';

const preview: PreviewResult = {
  projectName: 'git-ingest',
  rootDir: '/tmp/git-ingest',
  totalFiles: 1,
  includedFiles: [
    { relativePath: 'src/App.tsx', size: 42, label: 'TypeScript', language: 'TypeScript' },
  ],
  skippedFiles: [],
  ignoredDirectories: [],
  fileTypes: [],
  estimatedTokenCount: 10,
  estimatedOutputBytes: 42,
  warnings: [],
};

describe('FileListSheet', () => {
  it('exposes a focusable modal surface for keyboard inspection', () => {
    const html = renderToStaticMarkup(
      <FileListSheet initialTab="included" onClose={() => undefined} open preview={preview} />,
    );

    expect(html).toContain('data-testid="file-inspection-dialog"');
    expect(html).toContain('tabindex="-1"');
  });
});
