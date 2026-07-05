import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const coreEntry = path.resolve(currentDir, '../core/src/index.ts')

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@git-ingest/core': coreEntry
      }
    }
  },
  preload: {},
  renderer: {
    plugins: [react(), tailwindcss()]
  }
})
