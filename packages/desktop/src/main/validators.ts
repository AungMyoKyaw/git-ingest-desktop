import type { OutputFormat } from '@git-ingest/core';

export interface DesktopGeneratePayload {
  rootDir: string;
  format: OutputFormat;
  maxFileSizeBytes?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface LegacyDesktopGeneratePayload {
  rootPath: string;
  format: OutputFormat;
  maxFileSizeBytes?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
}

function ensureStringArray(value: unknown, field: string) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(`${field} must be a string array`);
  }

  return value.map((entry) => entry.trim()).filter(Boolean);
}

function ensureRootDir(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error('rootDir must be a string');
  }

  return value;
}

function ensureFormat(value: unknown): OutputFormat {
  if (value === undefined) {
    return 'markdown';
  }

  if (value !== 'markdown' && value !== 'text') {
    throw new Error('format must be markdown or text');
  }

  return value;
}

function ensureMaxFileSize(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error('maxFileSizeBytes must be a positive number');
  }

  return value;
}

export function validatePreviewPayload(payload: unknown) {
  const object = payload as Record<string, unknown>;
  return {
    rootDir: ensureRootDir(object?.rootDir),
    maxFileSizeBytes: ensureMaxFileSize(object?.maxFileSizeBytes),
    includePatterns: ensureStringArray(object?.includePatterns, 'includePatterns'),
    excludePatterns: ensureStringArray(object?.excludePatterns, 'excludePatterns'),
  };
}

export function validateGeneratePayload(payload: unknown): DesktopGeneratePayload {
  const object = payload as Record<string, unknown>;
  return {
    rootDir: ensureRootDir(object?.rootDir),
    format: ensureFormat(object?.format),
    maxFileSizeBytes: ensureMaxFileSize(object?.maxFileSizeBytes),
    includePatterns: ensureStringArray(object?.includePatterns, 'includePatterns'),
    excludePatterns: ensureStringArray(object?.excludePatterns, 'excludePatterns'),
  };
}

export function validateScanPayload(payload: unknown): LegacyDesktopGeneratePayload {
  const object = payload as Record<string, unknown>;
  return {
    rootPath: ensureRootDir(object?.rootPath),
    format: ensureFormat(object?.format),
    maxFileSizeBytes: ensureMaxFileSize(object?.maxFileSizeBytes),
    includePatterns: ensureStringArray(object?.includePatterns, 'includePatterns'),
    excludePatterns: ensureStringArray(object?.excludePatterns, 'excludePatterns'),
  };
}

export function validateExternalUrl(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Only https links are allowed');
  }

  const url = new URL(value);
  if (url.protocol !== 'https:') {
    throw new Error('Only https links are allowed');
  }

  return url.toString();
}

export const validateSafeExternalUrl = validateExternalUrl;
