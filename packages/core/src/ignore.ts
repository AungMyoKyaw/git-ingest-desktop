import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { minimatch } from 'minimatch'

const DEFAULT_IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'coverage', '.next', 'out', 'build'])

function normalizePattern(pattern: string) {
  return pattern.trim().replaceAll('\\', '/')
}

export function isDefaultIgnoredDirectory(name: string) {
  return DEFAULT_IGNORED_DIRECTORIES.has(name)
}

export function matchesPattern(relativePath: string, patterns: string[]) {
  return patterns.some((pattern) => minimatch(relativePath, normalizePattern(pattern), { dot: true, matchBase: true }))
}

export async function readGitIgnorePatterns(rootDir: string) {
  try {
    const file = await readFile(path.join(rootDir, '.gitignore'), 'utf8')
    return file
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map(normalizePattern)
  } catch {
    return []
  }
}

export function normalizePatterns(patterns?: string[]) {
  return (patterns ?? []).map((pattern) => pattern.trim()).filter(Boolean).map(normalizePattern)
}
