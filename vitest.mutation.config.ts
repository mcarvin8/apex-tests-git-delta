import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    clearMocks: true,
    testTimeout: 600_000,
    hookTimeout: 600_000,
    pool: 'forks',
  },
});
