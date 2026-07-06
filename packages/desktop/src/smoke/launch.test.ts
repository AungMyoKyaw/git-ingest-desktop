import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { _electron as electron } from 'playwright'
import { describe, expect, it } from 'vitest'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const desktopRoot = path.resolve(currentDir, '../..')

describe('desktop smoke test', () => {
  it('launches the app and renders the main screen', async () => {
    const electronApp = await electron.launch({
      args: [desktopRoot],
      cwd: desktopRoot,
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    })

    try {
      const window = await electronApp.firstWindow()
      await expect(window.locator('text=Git-Ingest').first().textContent()).resolves.toBe('Git-Ingest')
    } finally {
      await electronApp.close()
    }
  }, 30000)
})
