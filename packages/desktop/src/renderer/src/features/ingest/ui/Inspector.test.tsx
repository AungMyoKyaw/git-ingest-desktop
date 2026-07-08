import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { PreviewResult } from '../../../env';
import { Inspector } from './Inspector';

const preview: PreviewResult = {
  projectName: 'git-ingest',
  rootDir: '/tmp/git-ingest',
  totalFiles: 12,
  includedFiles: [],
  skippedFiles: [],
  ignoredDirectories: [],
  fileTypes: [],
  estimatedTokenCount: 0,
  estimatedOutputBytes: 0,
  warnings: Array.from({ length: 40 }, (_, index) => `Warning ${index + 1}`),
};

describe('Inspector', () => {
  it('keeps many warnings inside a generated-output-style scroll area', () => {
    const html = renderToStaticMarkup(
      <Inspector error={null} generated={null} message="" preview={preview} savedFilePath={null} />,
    );

    expect(html).toContain('data-testid="inspector-warnings-list"');
    expect(html).toContain('data-testid="inspector-warnings-section"');
    expect(html).toContain('flex min-h-0 flex-1 flex-col overflow-hidden');
    expect(html).toContain('min-h-0 flex-1 space-y-1.5 overflow-auto pr-1');
    expect(html).toContain('overflow-auto');
  });

  it('keeps inspector sections from shrinking so the inspector can scroll', () => {
    const html = renderToStaticMarkup(
      <Inspector
        error={null}
        generated={null}
        message=""
        preview={{ ...preview, warnings: ['Large folder', 'Large output'] }}
        savedFilePath={null}
      />,
    );

    expect(html).toContain('shrink-0 border-b border-line px-4 py-3.5');
  });

  it('does not duplicate output actions in the inspector rail', () => {
    const html = renderToStaticMarkup(
      <Inspector
        error={null}
        generated={{
          ...preview,
          output: '# Git-Ingest',
          outputBytes: 12,
          format: 'markdown',
          tokenEstimate: 3,
        }}
        message=""
        preview={preview}
        savedFilePath={null}
      />,
    );

    expect(html).not.toContain('Output Actions');
    expect(html).not.toContain('Clear output');
    expect(html).not.toContain('Open and Reveal are available after Save.');
  });

  it('prevents whole-inspector scrolling so section bodies own overflow', () => {
    const html = renderToStaticMarkup(
      <Inspector
        error={null}
        generated={null}
        message=""
        preview={{ ...preview, warnings: ['Large folder', 'Large output'] }}
        savedFilePath={null}
      />,
    );

    expect(html).toContain(
      'class="native-inspector flex h-full min-h-0 flex-col overflow-hidden border-l border-line"',
    );
  });

  it('keeps ignored directory details in their own scrollable section body', () => {
    const html = renderToStaticMarkup(
      <Inspector
        error={null}
        generated={null}
        message=""
        preview={{
          ...preview,
          ignoredDirectories: Array.from({ length: 20 }, (_, index) => ({
            path: `ignored-${index + 1}`,
            reason: 'default-ignore',
          })),
          warnings: ['Large folder', 'Large output'],
        }}
        savedFilePath={null}
      />,
    );

    expect(html).toContain('data-testid="inspector-ignored-section"');
    expect(html).toContain('data-testid="inspector-ignored-body"');
    expect(html).toContain('max-h-[210px] flex-col overflow-hidden');
    expect(html).toContain('min-h-0 overflow-auto');
  });
});
