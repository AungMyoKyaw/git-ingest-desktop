#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import clipboardy from 'clipboardy';

import {
  generateProjectOutput,
  toGitIngestError,
  type OutputFormat,
  type ScanProjectOptions,
} from '@git-ingest/core';

export interface CliOptions extends ScanProjectOptions {
  copy?: boolean;
  shouldCopy?: boolean;
  outputPath?: string;
}

export interface CliDeps {
  copy: (value: string) => Promise<void>;
  write: (value: string) => void;
}

const defaultDeps: CliDeps = {
  copy: (value) => clipboardy.write(value),
  write: (value) => process.stdout.write(value),
};

export function parseArgs(argv: string[]): CliOptions {
  const options: Partial<CliOptions> = {
    format: 'markdown',
    includePatterns: [],
    excludePatterns: [],
    copy: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value.startsWith('--') && !options.rootDir) {
      options.rootDir = value;
      continue;
    }

    switch (value) {
      case '--format':
        options.format = argv[++index] as OutputFormat;
        break;
      case '--output':
        options.outputPath = argv[++index];
        break;
      case '--max-size':
        options.maxFileSizeBytes = Number(argv[++index]);
        break;
      case '--include':
        options.includePatterns?.push(argv[++index]);
        break;
      case '--exclude':
        options.excludePatterns?.push(argv[++index]);
        break;
      case '--copy':
        options.copy = true;
        options.shouldCopy = true;
        break;
      default:
        throw new Error(`Unknown flag: ${value}`);
    }
  }

  if (!options.rootDir) {
    throw new Error(
      'Usage: git-ingest <folder> [--format markdown|text] [--output file] [--max-size bytes] [--include glob] [--exclude glob] [--copy]',
    );
  }

  return options as CliOptions;
}

export async function runCli(options: CliOptions, deps: CliDeps = defaultDeps) {
  const result = await generateProjectOutput(options);

  if (options.outputPath) {
    await writeFile(path.resolve(options.outputPath), result.output, 'utf8');
    deps.write(`Saved output to ${path.resolve(options.outputPath)}.\n`);
  }

  if (options.copy || options.shouldCopy) {
    await deps.copy(result.output);
    deps.write('Copied output to clipboard.\n');
  }

  if (!options.outputPath && !options.copy && !options.shouldCopy) {
    deps.write(result.output);
  }

  return result;
}

async function main() {
  try {
    await runCli(parseArgs(process.argv.slice(2)));
  } catch (error) {
    const normalized = toGitIngestError(error);
    process.stderr.write(`${normalized.userMessage}\n`);
    if (normalized.detail) {
      process.stderr.write(`${normalized.detail}\n`);
    }
    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  void main();
}
