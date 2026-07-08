import path from 'node:path';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { _electron as electron } from 'playwright';
import { describe, expect, it } from 'vitest';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(currentDir, '../..');

describe('desktop smoke test', () => {
  it('launches the app and renders the main screen', async () => {
    const electronApp = await electron.launch({
      args: [desktopRoot],
      cwd: desktopRoot,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    try {
      const window = await electronApp.firstWindow();
      await expect(window.locator('text=Git-Ingest').first().textContent()).resolves.toBe(
        'Git-Ingest',
      );
    } finally {
      await electronApp.close();
    }
  }, 30000);

  it('reloads preview when the current project is selected from recents', async () => {
    const userDataDir = await mkdtemp(path.join(tmpdir(), 'git-ingest-smoke-user-'));
    const projectDir = await mkdtemp(path.join(tmpdir(), 'git-ingest-smoke-project-'));
    await mkdir(path.join(projectDir, 'src'));
    await writeFile(path.join(projectDir, 'README.md'), '# Demo\n', 'utf8');
    await writeFile(path.join(projectDir, 'src/index.ts'), 'export const answer = 42;\n', 'utf8');
    await writeFile(
      path.join(userDataDir, 'git-ingest-state.json'),
      JSON.stringify(
        {
          lastFolderPath: projectDir,
          recentProjects: [
            {
              path: projectDir,
              name: path.basename(projectDir),
              lastOpenedAt: new Date().toISOString(),
            },
          ],
          settings: {
            format: 'markdown',
            maxFileSizeBytes: 1024 * 1024,
            includePatterns: [],
            excludePatterns: [],
            advancedOpen: false,
          },
        },
        null,
        2,
      ),
      'utf8',
    );

    const electronApp = await electron.launch({
      args: [desktopRoot, `--user-data-dir=${userDataDir}`],
      cwd: desktopRoot,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    try {
      const window = await electronApp.firstWindow();
      await window.getByText('Included files').waitFor({ timeout: 10000 });
      await window
        .getByRole('button', { name: new RegExp(path.basename(projectDir)) })
        .first()
        .click();
      await window.getByText('Included files').waitFor({ timeout: 10000 });
      await expect(window.getByText('2 files').first().textContent()).resolves.toContain('2 files');
    } finally {
      await electronApp.close();
    }
  }, 30000);
});
