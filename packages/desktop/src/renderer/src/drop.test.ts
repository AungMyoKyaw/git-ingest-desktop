import { describe, expect, it } from 'vitest'

import { resolveDropSelection } from './drop'

describe('resolveDropSelection', () => {
  it('accepts a single dropped folder path', () => {
    expect(
      resolveDropSelection({
        files: [{ path: '/tmp/project', type: '' }],
        items: [{ kind: 'file' }]
      })
    ).toEqual({ kind: 'folder', path: '/tmp/project' })
  })

  it('rejects multiple dropped folders', () => {
    expect(
      resolveDropSelection({
        files: [{ path: '/tmp/a', type: '' }, { path: '/tmp/b', type: '' }],
        items: [{ kind: 'file' }, { kind: 'file' }]
      })
    ).toEqual({ kind: 'error', code: 'MULTI_DROP', message: 'Drop one folder at a time.' })
  })

  it('rejects dropped files instead of folders', () => {
    expect(
      resolveDropSelection({
        files: [{ path: '/tmp/readme.md', type: 'text/markdown' }],
        items: [{ kind: 'file' }]
      })
    ).toEqual({ kind: 'error', code: 'FILE_DROP', message: 'Drop a folder, not an individual file.' })
  })
})
