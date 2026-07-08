import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { createBrowserWindowWebPreferences, resolvePreloadEntryPath } from './paths';

describe('resolvePreloadEntryPath', () => {
  it('points BrowserWindow at the built preload bundle', () => {
    expect(resolvePreloadEntryPath('/tmp/app/out/main')).toBe(
      path.join('/tmp/app/out/preload/index.mjs'),
    );
  });
});

describe('createBrowserWindowWebPreferences', () => {
  it('disables sandbox for the ESM preload bridge', () => {
    expect(createBrowserWindowWebPreferences('/tmp/app/out/main')).toMatchObject({
      preload: path.join('/tmp/app/out/preload/index.mjs'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      webSecurity: true,
    });
  });
});
