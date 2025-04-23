import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec,tests}.{js,ts}'],
    environment: 'node',
    globals: true,
  },
}) 