import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { validateExistingFilePath } from './file-actions'

const tempRoots: string[] = []

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((entry) => rm(entry, { recursive: true, force: true })))
})

describe('validateExistingFilePath', () => {
  it('returns the existing file path', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'git-ingest-file-actions-'))
    tempRoots.push(root)
    const filePath = path.join(root, 'output.md')
    await writeFile(filePath, '# hello\n')

    await expect(validateExistingFilePath(filePath)).resolves.toBe(filePath)
  })

  it('rejects missing files with a controlled message', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'git-ingest-file-actions-'))
    tempRoots.push(root)
    const filePath = path.join(root, 'missing.md')

    await expect(validateExistingFilePath(filePath)).rejects.toMatchObject({
      code: 'MISSING_FILE'
    })
  })
})
