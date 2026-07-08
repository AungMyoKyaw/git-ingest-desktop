import { describe, expect, it } from 'vitest';

import { removeRecentProject, type AppState } from './state';

function makeState(): AppState {
  return {
    lastFolderPath: '/repos/current',
    recentProjects: [
      { path: '/repos/current', name: 'current', lastOpenedAt: '2026-07-08T01:00:00.000Z' },
      { path: '/repos/old', name: 'old', lastOpenedAt: '2026-07-07T01:00:00.000Z' },
    ],
    settings: {
      format: 'markdown',
      maxFileSizeBytes: 1024,
      includePatterns: [],
      excludePatterns: [],
      advancedOpen: false,
    },
  };
}

describe('removeRecentProject', () => {
  it('clears the selected project when removing the current recent project', () => {
    const next = removeRecentProject(makeState(), '/repos/current');

    expect(next.lastFolderPath).toBe(null);
    expect(next.recentProjects).toEqual([
      { path: '/repos/old', name: 'old', lastOpenedAt: '2026-07-07T01:00:00.000Z' },
    ]);
  });
});
