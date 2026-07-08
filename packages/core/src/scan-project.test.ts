import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { generateProject, previewProject } from './scan-project';
import { AppError } from './errors';

describe('previewProject', () => {
  let rootPath: string;

  beforeEach(async () => {
    rootPath = await mkdtemp(path.join(os.tmpdir(), 'git-ingest-core-'));
    await mkdir(path.join(rootPath, 'src'));
    await mkdir(path.join(rootPath, 'node_modules'));
    await writeFile(path.join(rootPath, 'src', 'index.ts'), 'export const answer = 42;\n');
    await writeFile(path.join(rootPath, 'README.md'), '# Hello\n');
    await writeFile(path.join(rootPath, 'node_modules', 'ignored.js'), "console.log('ignored');\n");
  });

  afterEach(async () => {
    await rm(rootPath, { recursive: true, force: true });
  });

  it('rejects a missing directory', async () => {
    await expect(
      previewProject({ rootPath: path.join(rootPath, 'missing') }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('filters files using include patterns', async () => {
    const result = await previewProject({ rootPath, includePatterns: ['src/**/*.ts'] });
    expect(result.includedFiles).toBe(1);
    expect(result.entries.find((entry) => entry.path === 'README.md')?.ignored).toBe(true);
  });

  it('filters files using exclude patterns', async () => {
    const result = await previewProject({ rootPath, excludePatterns: ['README.md'] });
    expect(result.entries.find((entry) => entry.path === 'README.md')?.ignored).toBe(true);
  });

  it('skips files above max size', async () => {
    const result = await previewProject({ rootPath, maxFileSizeBytes: 2 });
    expect(result.skippedFiles).toBeGreaterThan(0);
  });

  it('emits progress events and generates markdown output', async () => {
    const phases: string[] = [];
    const result = await generateProject({ rootPath, format: 'markdown' }, (event) => {
      phases.push(event.phase);
    });

    expect(result.output).toContain('## src/index.ts');
    expect(result.approximateTokens).toBeGreaterThan(0);
    expect(phases).toContain('validating');
    expect(phases).toContain('done');
  });

  it('cancels generation when the abort signal is triggered', async () => {
    await writeFile(path.join(rootPath, 'src', 'second.ts'), 'export const second = true;\n');
    const controller = new AbortController();

    await expect(
      generateProject(
        {
          rootPath,
          format: 'markdown',
          signal: controller.signal,
        },
        (event) => {
          if (event.phase === 'processing') {
            controller.abort();
          }
        },
      ),
    ).rejects.toMatchObject({
      code: 'CANCELLED',
    });
  });
});
