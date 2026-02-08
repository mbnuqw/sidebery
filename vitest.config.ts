import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
  test: {
    dir: './src',
    environment: 'jsdom',
    setupFiles: ['./tests/env-setup.ts', './tests/ipc-setup.ts'],
  },
})
