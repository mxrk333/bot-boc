import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // This tells Vitest where to look for your test files
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // This is the "Magic Map" that fixes the @repo/shared error
      '@repo/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
})
