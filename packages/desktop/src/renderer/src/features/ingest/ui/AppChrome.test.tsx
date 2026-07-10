import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AppChrome } from './AppChrome';

describe('AppChrome', () => {
  it('does not repeat Copy after generated output exposes its own export actions', () => {
    const html = renderToStaticMarkup(
      <AppChrome
        canSave
        hasOutput
        inspectorOpen={false}
        onCancel={() => undefined}
        onChooseFolder={() => undefined}
        onCopy={() => undefined}
        onGenerate={() => undefined}
        onSave={() => undefined}
        onToggleInspector={() => undefined}
        primaryAction={{ kind: 'copy', label: 'Copy', disabled: false }}
        steps={[
          { label: 'Project', status: 'complete' },
          { label: 'Preview', status: 'complete' },
          { label: 'Generate', status: 'complete' },
          { label: 'Export', status: 'current' },
        ]}
      />,
    );

    expect(html).not.toContain('>Copy<');
    expect(html).toContain('>Save<');
  });
});
