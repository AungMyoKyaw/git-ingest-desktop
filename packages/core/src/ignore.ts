import { readFile } from 'node:fs/promises';
import path from 'node:path';

import ignore from 'ignore';
import { minimatch } from 'minimatch';

const DEFAULT_IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'coverage',
  '.next',
  'out',
  'build',
]);

const DEFAULT_IGNORE_PATTERNS = [
  'git-ingest-*.txt',
  'git-ingest-*.json',
  'git-ingest-*.md',
  'package-lock.json',
  '.git/',
  '.git',
  '.svn/',
  '.hg/',
  '.gitignore',
  'node_modules/',
  'node_modules',
  'bower_components/',
  'jspm_packages/',
  'web_modules/',
  'vendor/',
  '.npm/',
  '.cache/',
  '.next/',
  '.nuxt/',
  '.parcel-cache/',
  '.tmp/',
  '.virtualenv/',
  '.vs/',
  '.vscode/',
  '__pycache__/',
  'coverage/',
  'nyc_output/',
  'target/',
  'temp/',
  'tmp/',
  'venv/',
  'dist/',
  'dist',
  'build/',
  'out/',
  'bin/',
  'obj/',
  '.DS_Store',
  '*.log',
  'logs/',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '.env',
  '.env.*',
  '!.env.example',
  '*.jpg',
  '*.jpeg',
  '*.png',
  '*.gif',
  '*.svg',
  '*.webp',
  '*.ico',
  '*.pdf',
  '*.zip',
  '*.tar',
  '*.gz',
  '*.rar',
  '*.7z',
  '*.mp4',
  '*.avi',
  '*.mov',
  '*.mp3',
  '*.wav',
  '*.exe',
  '*.dll',
  '*.so',
  '*.dylib',
  '*.class',
  '*.jar',
  '.eslintcache',
  '.stylelintcache',
  '*.tsbuildinfo',
  '.pnpm/',
  '.output/',
  '.vercel/',
  '.netlify/',
];

function normalizePattern(pattern: string) {
  return pattern.trim().replaceAll('\\', '/');
}

export function isDefaultIgnoredDirectory(name: string) {
  return DEFAULT_IGNORED_DIRECTORIES.has(name);
}

export function matchesPattern(relativePath: string, patterns: string[]) {
  return patterns.some((pattern) =>
    minimatch(relativePath, normalizePattern(pattern), { dot: true, matchBase: true }),
  );
}

export function createIgnoreMatcher(patterns: string[]) {
  return ignore().add(patterns.map(normalizePattern));
}

export function getDefaultIgnorePatterns() {
  return [...DEFAULT_IGNORE_PATTERNS];
}

export function isIgnoredPath(
  relativePath: string,
  matcher: ReturnType<typeof createIgnoreMatcher>,
  isDirectory = false,
) {
  const normalizedPath = normalizePattern(relativePath);
  if (matcher.ignores(normalizedPath)) {
    return true;
  }

  return isDirectory ? matcher.ignores(`${normalizedPath}/`) : false;
}

export async function readGitIgnorePatterns(rootDir: string) {
  try {
    const file = await readFile(path.join(rootDir, '.gitignore'), 'utf8');
    return file
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map(normalizePattern);
  } catch {
    return [];
  }
}

export function normalizePatterns(patterns?: string[]) {
  return (patterns ?? [])
    .map((pattern) => pattern.trim())
    .filter(Boolean)
    .map(normalizePattern);
}
