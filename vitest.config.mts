import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.ts'],
    exclude: ['src/**/*.local.*', 'node_modules', 'dist'],
  },
})
